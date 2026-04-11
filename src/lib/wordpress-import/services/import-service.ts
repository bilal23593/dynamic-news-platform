import type { Prisma } from "@prisma/client";
import { resolveCategoryNavigationMeta } from "@/lib/category-navigation";
import { prisma } from "@/server/prisma";
import { parseWordpressCsv } from "@/lib/wordpress-import/parsers/csv";
import { parseWordpressJson } from "@/lib/wordpress-import/parsers/json";
import { parseWordpressXml } from "@/lib/wordpress-import/parsers/xml";
import { mapWordpressAuthors } from "@/lib/wordpress-import/mappers/authors";
import { mapWordpressCategories } from "@/lib/wordpress-import/mappers/categories";
import { inferImportedArticleCategory } from "@/lib/wordpress-import/services/category-inference";
import { transformWordpressHtmlToEditorBlocks } from "@/lib/wordpress-import/transformers/html";
import type { WordpressDryRunResult, WordpressImportInput, WordpressPostRecord } from "@/lib/wordpress-import/types";
import { slugify } from "@/lib/utils";

function parsePayload(input: WordpressImportInput): WordpressPostRecord[] {
  if (input.format === "xml") return parseWordpressXml(input.payload);
  if (input.format === "json") return parseWordpressJson(input.payload);
  return parseWordpressCsv(input.payload);
}

export function importWordpressMedia(posts: WordpressPostRecord[]) {
  const seen = new Map<string, { url: string; title?: string }>();
  posts.forEach((post) => {
    if (post.featuredImageUrl) {
      seen.set(post.featuredImageUrl, { url: post.featuredImageUrl, title: post.title });
    }
    post.media.forEach((media) => {
      if (!seen.has(media.url)) {
        seen.set(media.url, media);
      }
    });
  });
  return Array.from(seen.values());
}

export function createLegacyRedirects(posts: WordpressPostRecord[]) {
  return posts
    .filter((post) => post.legacyUrl)
    .map((post) => ({
      sourcePath: new URL(post.legacyUrl!, "https://legacy.example.com").pathname,
      destinationPath: `/article/${post.slug}`,
      statusCode: 301,
      active: true,
      notes: "Generated during WordPress migration.",
    }));
}

export function runDryImport(input: WordpressImportInput): WordpressDryRunResult {
  const posts = parsePayload(input);
  const { categories, tags } = mapWordpressCategories(posts);
  const authors = mapWordpressAuthors(posts);
  const media = importWordpressMedia(posts);
  const duplicates = posts.length - new Set(posts.map((post) => post.slug)).size;

  return {
    title: "WordPress dry run",
    postsDetected: posts.length,
    categoriesDetected: categories.length,
    tagsDetected: tags.length,
    authorsDetected: authors.length,
    mediaDetected: media.length,
    duplicatesFlagged: duplicates,
    previewTitles: posts.slice(0, 6).map((post) => post.title),
    warnings: [
      duplicates ? "Duplicate slugs detected and should be normalized before final import." : "No duplicate slugs detected in the preview sample.",
      posts.some((post) => /\[.+\]/.test(post.html))
        ? "Shortcodes were detected and will be stripped during transformation."
        : "No legacy shortcodes detected in the preview sample.",
    ],
  };
}

export async function importPostsFromWordpress(input: WordpressImportInput, initiatedById?: string) {
  const posts = parsePayload(input);
  const { categories, tags } = mapWordpressCategories(posts);
  const authors = mapWordpressAuthors(posts);
  const media = importWordpressMedia(posts);

  const batch = await prisma.importBatch.create({
    data: {
      title: "WordPress import",
      sourceType:
        input.format === "xml" ? "WORDPRESS_XML" : input.format === "json" ? "WORDPRESS_API" : "CSV",
      status: "RUNNING",
      dryRun: false,
      initiatedById,
      stats: {
        postsDetected: posts.length,
        categoriesDetected: categories.length,
        tagsDetected: tags.length,
        authorsDetected: authors.length,
        mediaDetected: media.length,
      },
      startedAt: new Date(),
    },
  });

  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const normalizedCategory = resolveCategoryNavigationMeta(category);
    const created = await prisma.category.upsert({
      where: { slug: normalizedCategory.slug },
      update: { name: normalizedCategory.name, label: normalizedCategory.label, sortOrder: normalizedCategory.sortOrder },
      create: {
        name: normalizedCategory.name,
        slug: normalizedCategory.slug,
        label: normalizedCategory.label,
        sortOrder: normalizedCategory.sortOrder,
      },
    });
    categoryMap.set(normalizedCategory.slug, created.id);
  }

  const tagMap = new Map<string, string>();
  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: { name: tag.name, slug: tag.slug },
    });
    tagMap.set(tag.slug, created.id);
  }

  const authorMap = new Map<string, string>();
  for (const author of authors) {
    const created = await prisma.authorProfile.upsert({
      where: { slug: author.slug },
      update: { displayName: author.displayName },
      create: { displayName: author.displayName, slug: author.slug, bio: `${author.displayName} imported from WordPress.` },
    });
    authorMap.set(author.slug, created.id);
  }

  const mediaMap = new Map<string, string>();
  for (const asset of media) {
    const created = await prisma.media.create({
      data: {
        title: asset.title || asset.url.split("/").pop() || "Imported media",
        fileName: asset.url.split("/").pop() || `import-${slugify(asset.url)}`,
        originalName: asset.url.split("/").pop() || `import-${slugify(asset.url)}`,
        mimeType: "image/jpeg",
        url: asset.url,
        storagePath: asset.url,
        storageProvider: "remote",
        legacyUrl: asset.url,
      },
    });
    mediaMap.set(asset.url, created.id);
  }

  for (const post of posts) {
    const transformed = transformWordpressHtmlToEditorBlocks(post.html);
    const primaryCategory = post.categories.find((item) => item.domain === "category");
    const authorSlug = slugify(post.authorName || "imported-author");
    const inferredCategory = inferImportedArticleCategory({
      title: post.title,
      excerpt: post.excerpt,
      contentText: transformed.text,
      currentCategorySlug: primaryCategory?.slug || null,
      tagSlugs: post.categories.filter((item) => item.domain === "post_tag").map((item) => item.slug || slugify(item.name)),
      tagNames: post.categories.filter((item) => item.domain === "post_tag").map((item) => item.name),
    });
    const resolvedCategorySlug = inferredCategory.resolvedCategorySlug || primaryCategory?.slug || "";
    const article = await prisma.article.create({
      data: {
        importBatchId: batch.id,
        legacyPostId: post.sourceId,
        legacySlug: post.slug,
        legacyAuthorName: post.authorName,
        title: post.title,
        slug: post.slug || slugify(post.title),
        excerpt: post.excerpt || transformed.text.slice(0, 180),
        contentHtml: transformed.html,
        contentJson: transformed.json as Prisma.InputJsonValue,
        contentText: transformed.text,
        featuredImageId: post.featuredImageUrl ? mediaMap.get(post.featuredImageUrl) : undefined,
        categoryId: categoryMap.get(resolvedCategorySlug) || categoryMap.get(primaryCategory?.slug || "") || (await prisma.category.findFirst({ select: { id: true } }))!.id,
        authorId: authorMap.get(authorSlug) || (await prisma.authorProfile.findFirst({ select: { id: true } }))!.id,
        status: post.status === "publish" ? "PUBLISHED" : "DRAFT",
        publishAt: post.publishDate ? new Date(post.publishDate) : new Date(),
        readTime: transformed.readTime,
      },
    });

    const tagIds = post.categories
      .filter((item) => item.domain === "post_tag")
      .map((item) => tagMap.get(item.slug || slugify(item.name)))
      .filter(Boolean) as string[];

    if (tagIds.length) {
      await prisma.articleTag.createMany({
        data: tagIds.map((tagId) => ({
          articleId: article.id,
          tagId,
        })),
      });
    }

    await prisma.legacyContentMap.create({
      data: {
        batchId: batch.id,
        sourceType:
          input.format === "xml" ? "WORDPRESS_XML" : input.format === "json" ? "WORDPRESS_API" : "CSV",
        legacyEntityType: "ARTICLE",
        legacyId: post.sourceId,
        legacySlug: post.slug,
        legacyUrl: post.legacyUrl,
        newArticleId: article.id,
        status: "imported",
      },
    });
  }

  const redirects = createLegacyRedirects(posts);
  for (const redirect of redirects) {
    await prisma.redirect.upsert({
      where: { sourcePath: redirect.sourcePath },
      update: redirect,
      create: redirect,
    });
  }

  await prisma.importLog.create({
    data: {
      batchId: batch.id,
      level: "INFO",
      entityType: "wordpress-import",
      message: `Imported ${posts.length} posts and generated ${redirects.length} redirects.`,
    },
  });

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
    },
  });

  return {
    batchId: batch.id,
    importedPosts: posts.length,
    redirectsCreated: redirects.length,
  };
}

export async function finalizeImport(input: WordpressImportInput, initiatedById?: string) {
  return importPostsFromWordpress(input, initiatedById);
}
