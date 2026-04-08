'use server';

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { htmlToPlainText } from "@/lib/content";
import { calculateReadTime } from "@/lib/utils";
import type { ActionState } from "@/types";
import { requirePermission } from "@/server/auth/session";
import { refreshArticleCaches, refreshHomepageCaches, refreshPageCaches } from "@/server/cms/cache";
import { booleanFromForm, ensureUniqueSlug, optionalString } from "@/server/cms/helpers";
import { prisma } from "@/server/prisma";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(8, "Headline is too short."),
  slug: z.string().trim().optional(),
  subtitle: z.string().trim().optional(),
  excerpt: z.string().trim().min(20, "Excerpt is required."),
  contentHtml: z.string().trim().min(20, "Story body is required."),
  contentJson: z.string().trim().optional(),
  categoryId: z.string().min(1, "Select a category."),
  subCategoryId: z.string().optional(),
  authorId: z.string().min(1, "Select an author."),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  publishAt: z.string().optional(),
  featuredImageId: z.string().optional(),
  ogImageId: z.string().optional(),
  imageCaption: z.string().trim().optional(),
  videoEmbedUrl: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  schemaType: z.string().trim().default("NewsArticle"),
  allowComments: z.boolean(),
  breakingNews: z.boolean(),
  trending: z.boolean(),
  featured: z.boolean(),
  popular: z.boolean(),
  relatedContentMode: z.enum(["AUTOMATIC", "MANUAL", "HYBRID"]).default("HYBRID"),
  relatedContentLimit: z.coerce.number().int().min(2).max(8).default(4),
  tagIds: z.array(z.string()).default([]),
  relatedArticleIds: z.array(z.string()).default([]),
});

const pageSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3),
  slug: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  contentHtml: z.string().trim().min(20),
  contentJson: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seoTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  schemaType: z.string().trim().default("WebPage"),
  ogImageId: z.string().optional(),
  showInHeader: z.boolean(),
  showInFooter: z.boolean(),
});

function parseContentJson(value: string | undefined) {
  return value ? (JSON.parse(value) as Prisma.InputJsonValue) : undefined;
}

export async function saveArticleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manage_articles");

  const parsed = articleSchema.safeParse({
    id: optionalString(formData.get("id")),
    title: formData.get("title"),
    slug: optionalString(formData.get("slug")),
    subtitle: optionalString(formData.get("subtitle")),
    excerpt: formData.get("excerpt"),
    contentHtml: formData.get("contentHtml"),
    contentJson: optionalString(formData.get("contentJson")),
    categoryId: formData.get("categoryId"),
    subCategoryId: optionalString(formData.get("subCategoryId")),
    authorId: formData.get("authorId"),
    status: formData.get("status"),
    publishAt: optionalString(formData.get("publishAt")),
    featuredImageId: optionalString(formData.get("featuredImageId")),
    ogImageId: optionalString(formData.get("ogImageId")),
    imageCaption: optionalString(formData.get("imageCaption")),
    videoEmbedUrl: optionalString(formData.get("videoEmbedUrl")) || "",
    seoTitle: optionalString(formData.get("seoTitle")),
    metaDescription: optionalString(formData.get("metaDescription")),
    canonicalUrl: optionalString(formData.get("canonicalUrl")) || "",
    schemaType: optionalString(formData.get("schemaType")) || "NewsArticle",
    allowComments: booleanFromForm(formData.get("allowComments")),
    breakingNews: booleanFromForm(formData.get("breakingNews")),
    trending: booleanFromForm(formData.get("trending")),
    featured: booleanFromForm(formData.get("featured")),
    popular: booleanFromForm(formData.get("popular")),
    relatedContentMode: optionalString(formData.get("relatedContentMode")) || "HYBRID",
    relatedContentLimit: Number(formData.get("relatedContentLimit") || 4),
    tagIds: formData.getAll("tagIds").map(String),
    relatedArticleIds: formData.getAll("relatedArticleIds").map(String),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please correct the highlighted fields.",
    };
  }

  const previousArticle = parsed.data.id
    ? await prisma.article.findUnique({
        where: { id: parsed.data.id },
        select: {
          slug: true,
          category: { select: { slug: true } },
          author: { select: { slug: true } },
          tags: { select: { tag: { select: { slug: true } } } },
        },
      })
    : null;

  const slug = await ensureUniqueSlug("article", parsed.data.slug || parsed.data.title, parsed.data.id);
  const contentText = htmlToPlainText(parsed.data.contentHtml);
  const publishAt =
    parsed.data.publishAt && !Number.isNaN(Date.parse(parsed.data.publishAt))
      ? new Date(parsed.data.publishAt)
      : new Date();

  const article = await prisma.article.upsert({
    where: { id: parsed.data.id || "new-article" },
    update: {
      title: parsed.data.title,
      slug,
      subtitle: parsed.data.subtitle,
      excerpt: parsed.data.excerpt,
      contentHtml: parsed.data.contentHtml,
      contentJson: parseContentJson(parsed.data.contentJson),
      contentText,
      categoryId: parsed.data.categoryId,
      subCategoryId: parsed.data.subCategoryId || undefined,
      authorId: parsed.data.authorId,
      status: parsed.data.status,
      publishAt,
      featuredImageId: parsed.data.featuredImageId || undefined,
      ogImageId: parsed.data.ogImageId || undefined,
      imageCaption: parsed.data.imageCaption,
      videoEmbedUrl: parsed.data.videoEmbedUrl || undefined,
      seoTitle: parsed.data.seoTitle,
      metaDescription: parsed.data.metaDescription,
      canonicalUrl: parsed.data.canonicalUrl || undefined,
      schemaType: parsed.data.schemaType,
      allowComments: parsed.data.allowComments,
      breakingNews: parsed.data.breakingNews,
      trending: parsed.data.trending,
      featured: parsed.data.featured,
      popular: parsed.data.popular,
      relatedContentMode: parsed.data.relatedContentMode,
      relatedContentLimit: parsed.data.relatedContentLimit,
      readTime: calculateReadTime(contentText),
    },
    create: {
      title: parsed.data.title,
      slug,
      subtitle: parsed.data.subtitle,
      excerpt: parsed.data.excerpt,
      contentHtml: parsed.data.contentHtml,
      contentJson: parseContentJson(parsed.data.contentJson),
      contentText,
      categoryId: parsed.data.categoryId,
      subCategoryId: parsed.data.subCategoryId || undefined,
      authorId: parsed.data.authorId,
      status: parsed.data.status,
      publishAt,
      featuredImageId: parsed.data.featuredImageId || undefined,
      ogImageId: parsed.data.ogImageId || undefined,
      imageCaption: parsed.data.imageCaption,
      videoEmbedUrl: parsed.data.videoEmbedUrl || undefined,
      seoTitle: parsed.data.seoTitle,
      metaDescription: parsed.data.metaDescription,
      canonicalUrl: parsed.data.canonicalUrl || undefined,
      schemaType: parsed.data.schemaType,
      allowComments: parsed.data.allowComments,
      breakingNews: parsed.data.breakingNews,
      trending: parsed.data.trending,
      featured: parsed.data.featured,
      popular: parsed.data.popular,
      relatedContentMode: parsed.data.relatedContentMode,
      relatedContentLimit: parsed.data.relatedContentLimit,
      readTime: calculateReadTime(contentText),
    },
  });

  await prisma.articleTag.deleteMany({ where: { articleId: article.id } });
  if (parsed.data.tagIds.length) {
    await prisma.articleTag.createMany({
      data: parsed.data.tagIds.map((tagId) => ({ articleId: article.id, tagId })),
    });
  }

  await prisma.articleRelation.deleteMany({ where: { sourceArticleId: article.id } });
  if (parsed.data.relatedArticleIds.length) {
    await prisma.articleRelation.createMany({
      data: parsed.data.relatedArticleIds.map((targetArticleId, index) => ({
        sourceArticleId: article.id,
        targetArticleId,
        sortOrder: index + 1,
      })),
      skipDuplicates: true,
    });
  }

  const currentArticle = await prisma.article.findUnique({
    where: { id: article.id },
    select: {
      slug: true,
      category: { select: { slug: true } },
      author: { select: { slug: true } },
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

  refreshArticleCaches({
    slug: previousArticle?.slug,
    categorySlug: previousArticle?.category.slug,
    authorSlug: previousArticle?.author.slug,
    tagSlugs: previousArticle?.tags.map(({ tag }) => tag.slug),
  });
  refreshArticleCaches({
    slug: currentArticle?.slug,
    categorySlug: currentArticle?.category.slug,
    authorSlug: currentArticle?.author.slug,
    tagSlugs: currentArticle?.tags.map(({ tag }) => tag.slug),
  });

  revalidatePath("/admin/articles");
  revalidatePath("/");
  redirect(`/admin/articles/${article.id}/edit` as never);
}

export async function deleteArticleAction(formData: FormData) {
  await requirePermission("manage_articles");
  const id = String(formData.get("id") || "");
  if (id) {
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        slug: true,
        category: { select: { slug: true } },
        author: { select: { slug: true } },
        tags: { select: { tag: { select: { slug: true } } } },
      },
    });

    await prisma.article.delete({ where: { id } });

    refreshArticleCaches({
      slug: article?.slug,
      categorySlug: article?.category.slug,
      authorSlug: article?.author.slug,
      tagSlugs: article?.tags.map(({ tag }) => tag.slug),
    });
  }
  revalidatePath("/admin/articles");
  revalidatePath("/");
  redirect("/admin/articles");
}

export async function savePageAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePermission("manage_pages");

  const parsed = pageSchema.safeParse({
    id: optionalString(formData.get("id")),
    title: formData.get("title"),
    slug: optionalString(formData.get("slug")),
    summary: optionalString(formData.get("summary")),
    contentHtml: formData.get("contentHtml"),
    contentJson: optionalString(formData.get("contentJson")),
    status: formData.get("status"),
    seoTitle: optionalString(formData.get("seoTitle")),
    metaDescription: optionalString(formData.get("metaDescription")),
    canonicalUrl: optionalString(formData.get("canonicalUrl")) || "",
    schemaType: optionalString(formData.get("schemaType")) || "WebPage",
    ogImageId: optionalString(formData.get("ogImageId")),
    showInHeader: booleanFromForm(formData.get("showInHeader")),
    showInFooter: booleanFromForm(formData.get("showInFooter")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please correct the highlighted fields.",
    };
  }

  const previousPage = parsed.data.id
    ? await prisma.page.findUnique({
        where: { id: parsed.data.id },
        select: { slug: true },
      })
    : null;

  const slug = await ensureUniqueSlug("page", parsed.data.slug || parsed.data.title, parsed.data.id);
  const page = await prisma.page.upsert({
    where: { id: parsed.data.id || "new-page" },
    update: {
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      contentHtml: parsed.data.contentHtml,
      contentJson: parseContentJson(parsed.data.contentJson),
      status: parsed.data.status,
      seoTitle: parsed.data.seoTitle,
      metaDescription: parsed.data.metaDescription,
      canonicalUrl: parsed.data.canonicalUrl || undefined,
      schemaType: parsed.data.schemaType,
      ogImageId: parsed.data.ogImageId || undefined,
      showInHeader: parsed.data.showInHeader,
      showInFooter: parsed.data.showInFooter,
    },
    create: {
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      contentHtml: parsed.data.contentHtml,
      contentJson: parseContentJson(parsed.data.contentJson),
      status: parsed.data.status,
      seoTitle: parsed.data.seoTitle,
      metaDescription: parsed.data.metaDescription,
      canonicalUrl: parsed.data.canonicalUrl || undefined,
      schemaType: parsed.data.schemaType,
      ogImageId: parsed.data.ogImageId || undefined,
      showInHeader: parsed.data.showInHeader,
      showInFooter: parsed.data.showInFooter,
    },
  });

  refreshPageCaches([previousPage?.slug, page.slug].filter(Boolean) as string[]);

  revalidatePath("/admin/pages");
  revalidatePath("/");
  redirect(`/admin/pages?edit=${page.id}` as never);
}

export async function deletePageAction(formData: FormData) {
  await requirePermission("manage_pages");
  const id = String(formData.get("id") || "");
  if (id) {
    const page = await prisma.page.findUnique({
      where: { id },
      select: { slug: true },
    });

    await prisma.page.delete({ where: { id } });

    refreshPageCaches(page?.slug ? [page.slug] : []);
  }
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

export async function saveHomepageSectionAction(formData: FormData) {
  await requirePermission("manage_homepage");
  const parsed = z
    .object({
      id: z.string().optional(),
      key: z.string().trim().min(2),
      type: z.enum([
        "HERO",
        "BREAKING_STRIP",
        "LATEST_NEWS",
        "TRENDING",
        "MOST_READ",
        "CATEGORY_BLOCK",
        "EDITOR_PICKS",
        "VIDEO_HIGHLIGHTS",
        "SPONSORED_BLOCK",
        "NEWSLETTER_CTA",
        "AD_SLOT_BLOCK",
      ]),
      title: z.string().trim().min(2),
      description: z.string().trim().optional(),
      enabled: z.boolean(),
      sortOrder: z.coerce.number().int().min(0).default(0),
      sourceType: z.enum(["MANUAL", "LATEST", "TRENDING", "MOST_READ", "BREAKING", "FEATURED", "CATEGORY", "TAG", "VIDEO"]),
      limit: z.coerce.number().int().min(1).max(12).default(4),
      categoryId: z.string().optional(),
      tagId: z.string().optional(),
      adSlotId: z.string().optional(),
      layout: z.enum(["cards", "dense", "split", "compact", "utility", "weather"]).optional().or(z.literal("")),
      eyebrow: z.string().trim().optional(),
      viewAllHref: z.string().trim().optional(),
      viewAllLabel: z.string().trim().optional(),
      promoText: z.string().trim().optional(),
      ctaLabel: z.string().trim().optional(),
      ctaHref: z.string().trim().optional(),
      manualArticleIds: z.array(z.string()).default([]),
    })
    .parse({
      id: optionalString(formData.get("id")),
      key: formData.get("key"),
      type: formData.get("type"),
      title: formData.get("title"),
      description: optionalString(formData.get("description")),
      enabled: booleanFromForm(formData.get("enabled")),
      sortOrder: Number(formData.get("sortOrder") || 0),
      sourceType: formData.get("sourceType"),
      limit: Number(formData.get("limit") || 4),
      categoryId: optionalString(formData.get("categoryId")),
      tagId: optionalString(formData.get("tagId")),
      adSlotId: optionalString(formData.get("adSlotId")),
      layout: optionalString(formData.get("layout")) || "",
      eyebrow: optionalString(formData.get("eyebrow")),
      viewAllHref: optionalString(formData.get("viewAllHref")),
      viewAllLabel: optionalString(formData.get("viewAllLabel")),
      promoText: optionalString(formData.get("promoText")),
      ctaLabel: optionalString(formData.get("ctaLabel")),
      ctaHref: optionalString(formData.get("ctaHref")),
      manualArticleIds: formData.getAll("manualArticleIds").map(String),
    });

  const settings = Object.fromEntries(
    Object.entries({
      layout: parsed.layout || undefined,
      eyebrow: parsed.eyebrow,
      viewAllHref: parsed.viewAllHref,
      viewAllLabel: parsed.viewAllLabel,
      promoText: parsed.promoText,
      ctaLabel: parsed.ctaLabel,
      ctaHref: parsed.ctaHref,
    }).filter(([, value]) => Boolean(value)),
  ) as Prisma.InputJsonValue;

  const section = await prisma.homepageSection.upsert({
    where: { id: parsed.id || "new-section" },
    update: {
      key: parsed.key,
      type: parsed.type,
      title: parsed.title,
      description: parsed.description,
      enabled: parsed.enabled,
      sortOrder: parsed.sortOrder,
      sourceType: parsed.sourceType,
      limit: parsed.limit,
      categoryId: parsed.categoryId,
      tagId: parsed.tagId,
      adSlotId: parsed.adSlotId,
      settings,
    },
    create: {
      key: parsed.key,
      type: parsed.type,
      title: parsed.title,
      description: parsed.description,
      enabled: parsed.enabled,
      sortOrder: parsed.sortOrder,
      sourceType: parsed.sourceType,
      limit: parsed.limit,
      categoryId: parsed.categoryId,
      tagId: parsed.tagId,
      adSlotId: parsed.adSlotId,
      settings,
    },
  });

  await prisma.homepageSectionItem.deleteMany({ where: { sectionId: section.id } });
  if (parsed.sourceType === "MANUAL" && parsed.manualArticleIds.length) {
    await prisma.homepageSectionItem.createMany({
      data: parsed.manualArticleIds.map((articleId, index) => ({
        sectionId: section.id,
        articleId,
        sortOrder: index + 1,
      })),
    });
  }

  refreshHomepageCaches();

  revalidatePath("/admin/homepage");
  revalidatePath("/");
  redirect("/admin/homepage");
}

export async function deleteHomepageSectionAction(formData: FormData) {
  await requirePermission("manage_homepage");
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.homepageSection.delete({ where: { id } });
  }
  refreshHomepageCaches();
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  redirect("/admin/homepage");
}
