import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  demoAdSlots,
  demoArticles,
  demoAuthors,
  demoCategories,
  demoComments,
  demoHomepageSections,
  demoImportBatch,
  demoPages,
  demoRedirects,
  demoRoles,
  demoSettings,
  demoSubscribers,
  demoTags,
  demoUsers,
} from "@/config/demo-newsroom";
import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";

const prisma = new PrismaClient();

function requireMapValue(
  map: Map<string, string>,
  key: string,
  context: string,
  options?: { normalize?: boolean },
) {
  const normalizedKey = options?.normalize ? slugify(key) : key;
  const value = map.get(key) || (normalizedKey ? map.get(normalizedKey) : undefined);

  if (!value) {
    throw new Error(`Missing seed reference for "${key}" while processing ${context}.`);
  }

  return value;
}

async function resetDatabase() {
  await prisma.comment.deleteMany();
  await prisma.homepageSectionItem.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.articleRelation.deleteMany();
  await prisma.articleGalleryItem.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.article.deleteMany();
  await prisma.page.deleteMany();
  await prisma.redirect.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adSlot.deleteMany();
  await prisma.importLog.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.externalSourceMapping.deleteMany();
  await prisma.legacyContentMap.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.authorProfile.deleteMany();
  await prisma.media.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
}

async function main() {
  await resetDatabase();

  const roles = new Map<string, string>();
  for (const role of demoRoles) {
    const created = await prisma.role.create({
      data: {
        name: role.name,
        label: role.label,
        permissions: role.permissions,
      },
    });

    roles.set(role.name, created.id);
  }

  const passwordHash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, 12);
  const userMap = new Map<string, string>();

  for (const user of demoUsers) {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        passwordHash,
        roleId: roles.get(user.roleName)!,
      },
    });
    userMap.set(user.email, created.id);
  }

  const authorAvatarMap = new Map<string, string>();
  for (const author of demoAuthors) {
    const avatar = await prisma.media.create({
      data: {
        title: `${author.displayName} avatar`,
        fileName: `${author.slug}-avatar.jpg`,
        originalName: `${author.slug}-avatar.jpg`,
        mimeType: "image/jpeg",
        url: author.avatarUrl,
        storagePath: author.avatarUrl,
        storageProvider: "remote",
      },
    });
    authorAvatarMap.set(author.slug, avatar.id);
  }

  const authorMap = new Map<string, string>();
  for (const author of demoAuthors) {
    const created = await prisma.authorProfile.create({
      data: {
        displayName: author.displayName,
        slug: author.slug,
        bio: author.bio,
        title: author.title,
        shortBio: author.shortBio,
        twitterUrl: author.twitterUrl,
        avatarId: authorAvatarMap.get(author.slug),
        userId: "userEmail" in author && author.userEmail ? userMap.get(author.userEmail) : undefined,
      },
    });
    authorMap.set(author.slug, created.id);
  }

  const categoryMap = new Map<string, string>();
  const subCategoryMap = new Map<string, string>();
  for (const [index, category] of demoCategories.entries()) {
    const created = await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        color: category.color,
        label: category.label,
        description: category.description,
        sortOrder: index + 1,
      },
    });
    categoryMap.set(category.slug, created.id);

    for (const [subIndex, subcategory] of category.subcategories.entries()) {
      const createdSub = await prisma.subCategory.create({
        data: {
          categoryId: created.id,
          name: subcategory.name,
          slug: subcategory.slug,
          sortOrder: subIndex + 1,
        },
      });
      subCategoryMap.set(`${category.slug}/${subcategory.slug}`, createdSub.id);
    }
  }

  const tagMap = new Map<string, string>();
  for (const tag of demoTags) {
    const created = await prisma.tag.create({ data: tag });
    tagMap.set(tag.slug, created.id);
    tagMap.set(tag.name, created.id);
  }

  const adSlotMap = new Map<string, string>();
  for (const slot of demoAdSlots) {
    const created = await prisma.adSlot.create({ data: slot });
    adSlotMap.set(slot.key, created.id);
  }

  const articleMap = new Map<string, string>();
  for (const [index, article] of demoArticles.entries()) {
    const featuredMedia = await prisma.media.create({
      data: {
        title: article.title,
        fileName: `${article.slug}.jpg`,
        originalName: `${article.slug}.jpg`,
        mimeType: "image/jpeg",
        url: article.imageUrl,
        storagePath: article.imageUrl,
        storageProvider: "remote",
      },
    });

    const created = await prisma.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        subtitle: article.subtitle,
        excerpt: article.excerpt,
        contentJson: article.contentJson as Prisma.InputJsonValue,
        contentHtml: article.contentHtml,
        contentText: article.contentText,
        featuredImageId: featuredMedia.id,
        imageCaption: "Demo newsroom illustration.",
        videoEmbedUrl: article.videoEmbedUrl,
        categoryId: categoryMap.get(article.categorySlug)!,
        subCategoryId: article.subCategorySlug
          ? subCategoryMap.get(`${article.categorySlug}/${article.subCategorySlug}`)
          : undefined,
        authorId: authorMap.get(article.authorSlug)!,
        status: article.status,
        publishAt: article.publishAt,
        breakingNews: Boolean(article.breakingNews),
        trending: Boolean(article.trending),
        featured: Boolean(article.featured),
        popular: Boolean(article.popular),
        seoTitle: article.seoTitle,
        metaDescription: article.metaDescription,
        schemaType: article.schemaType,
        viewCount: 11000 - index * 271,
        readTime: article.readTime,
        allowComments: true,
      },
    });

    articleMap.set(article.slug, created.id);

    if (article.tagSlugs.length) {
      await prisma.articleTag.createMany({
        data: article.tagSlugs.map((slug) => ({
          articleId: created.id,
          tagId: requireMapValue(tagMap, slug, `article "${article.slug}"`, { normalize: true }),
        })),
      });
    }
  }

  const articleIds = demoArticles.map((article) => articleMap.get(article.slug)!);
  for (let index = 0; index < articleIds.length - 1; index += 1) {
    await prisma.articleRelation.create({
      data: {
        sourceArticleId: articleIds[index],
        targetArticleId: articleIds[(index + 1) % articleIds.length],
        sortOrder: 1,
      },
    });
  }

  for (const page of demoPages) {
    await prisma.page.create({
      data: {
        ...page,
        contentJson: page.contentJson as Prisma.InputJsonValue,
      },
    });
  }

  for (const redirect of demoRedirects) {
    await prisma.redirect.create({ data: redirect });
  }

  for (const setting of demoSettings) {
    await prisma.siteSetting.create({ data: setting });
  }

  for (const subscriber of demoSubscribers) {
    await prisma.subscriber.create({ data: subscriber });
  }

  for (const comment of demoComments) {
    await prisma.comment.create({
      data: {
        articleId: articleMap.get(comment.articleSlug)!,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        content: comment.content,
        status: comment.status as "APPROVED" | "PENDING" | "REJECTED" | "SPAM",
        approvedAt: comment.status === "APPROVED" ? new Date() : undefined,
      },
    });
  }

  for (const section of demoHomepageSections) {
    const created = await prisma.homepageSection.create({
      data: {
        key: section.key,
        type: section.type,
        title: section.title,
        description: section.description,
        enabled: section.enabled,
        sortOrder: section.sortOrder,
        sourceType: section.sourceType,
        limit: section.limit,
        settings: (section.settings || undefined) as Prisma.InputJsonValue | undefined,
        categoryId: section.categorySlug
          ? requireMapValue(categoryMap, section.categorySlug, `homepage section "${section.key}"`)
          : undefined,
        tagId: section.tagSlug
          ? requireMapValue(tagMap, section.tagSlug, `homepage section "${section.key}"`, {
              normalize: true,
            })
          : undefined,
        adSlotId: section.adSlotKey
          ? requireMapValue(adSlotMap, section.adSlotKey, `homepage section "${section.key}"`)
          : undefined,
      },
    });

    if (section.manualArticleSlugs?.length) {
      await prisma.homepageSectionItem.createMany({
        data: section.manualArticleSlugs.map((slug, itemIndex) => ({
          sectionId: created.id,
          articleId: requireMapValue(articleMap, slug, `homepage section "${section.key}"`),
          sortOrder: itemIndex + 1,
        })),
      });
    }

    if (section.adSlotKey && !section.manualArticleSlugs?.length) {
      await prisma.homepageSectionItem.create({
        data: {
          sectionId: created.id,
          adSlotId: requireMapValue(adSlotMap, section.adSlotKey, `homepage section "${section.key}"`),
          sortOrder: 1,
        },
      });
    }
  }

  const batch = await prisma.importBatch.create({
    data: {
      title: demoImportBatch.title,
      sourceType: demoImportBatch.sourceType,
      status: demoImportBatch.status as "DRY_RUN",
      dryRun: demoImportBatch.dryRun,
      fileName: demoImportBatch.fileName,
      stats: demoImportBatch.stats as Prisma.InputJsonValue,
      initiatedBy: userMap.get("editor@redwire.local")
        ? {
            connect: { id: userMap.get("editor@redwire.local")! },
          }
        : undefined,
    },
  });

  await prisma.importLog.createMany({
    data: [
      {
        batchId: batch.id,
        level: "INFO",
        entityType: "wordpress-import",
        message: "Dry run completed and identified importable posts, pages, and media references.",
      },
      {
        batchId: batch.id,
        level: "WARN",
        entityType: "wordpress-import",
        message: "Duplicate slugs detected in legacy archive. Redirect generation is recommended before final import.",
      },
    ],
  });

  await prisma.legacyContentMap.createMany({
    data: demoArticles.slice(0, 6).map((article, index) => ({
      batchId: batch.id,
      sourceType: "WORDPRESS_XML",
      legacyEntityType: "ARTICLE",
      legacyId: `${1000 + index}`,
      legacySlug: article.slug,
      legacyUrl: `/2025/news/${article.slug}`,
      newArticleId: articleMap.get(article.slug),
      status: "matched",
    })),
  });

  console.log("Seed complete.");
  console.log(`Admin email: ${env.DEFAULT_ADMIN_EMAIL}`);
  console.log(`Admin password: ${env.DEFAULT_ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
