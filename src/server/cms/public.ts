import type { AdPlacement, Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { demoAdSlots, demoArticles, demoAuthors, demoCategories, demoComments, demoHomepageSections, demoPages, demoRedirects, demoTags } from "@/config/demo-newsroom";
import { isRenderableAdSlot } from "@/lib/ads";
import { sortNavigationCategories } from "@/lib/category-navigation";
import { selectAutomaticHomepageItems } from "@/lib/homepage-selection";
import { resolveRelatedStories } from "@/lib/related-content";
import type {
  HomepageSectionData,
  HomepageSectionSettings,
  PublicAdSlot,
  PublicArticleDetail,
  PublicArticleSummary,
  PublicAuthor,
  PublicCategory,
  PublicComment,
  PublicPage,
  PublicTag,
} from "@/types/cms";
import { CMS_CACHE_TAGS, CMS_CACHE_TTL, cmsCacheTag } from "@/server/cms/cache";
import { prisma } from "@/server/prisma";

const publicArticleInclude = {
  category: true,
  subCategory: true,
  author: {
    include: {
      avatar: true,
    },
  },
  featuredImage: true,
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: typeof publicArticleInclude;
}>;

function mapDemoTag(slug: string): PublicTag {
  const tag = demoTags.find((item) => item.slug === slug);
  return {
    id: slug,
    slug,
    name: tag?.name || slug,
  };
}

function mapDemoCategory(slug: string): PublicCategory {
  const category = demoCategories.find((item) => item.slug === slug);
  return {
    id: slug,
    slug,
    name: category?.name || slug,
    color: category?.color,
    label: category?.label,
  };
}

function mapDemoAuthor(slug: string): PublicAuthor {
  const author = demoAuthors.find((item) => item.slug === slug);
  return {
    id: slug,
    slug,
    displayName: author?.displayName || slug,
    title: author?.title,
    bio: author?.bio,
    avatarUrl: author?.avatarUrl,
    twitterUrl: author?.twitterUrl,
  };
}

function mapDemoArticle(article: (typeof demoArticles)[number]): PublicArticleSummary {
  const category = mapDemoCategory(article.categorySlug);
  const categoryRecord = demoCategories.find((item) => item.slug === article.categorySlug);
  const subCategory = article.subCategorySlug
    ? categoryRecord?.subcategories.find((item) => item.slug === article.subCategorySlug)
    : undefined;

  return {
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    publishAt: article.publishAt,
    updatedAt: article.publishAt,
    featuredImageUrl: article.imageUrl,
    imageCaption: "Demo newsroom illustration.",
    videoEmbedUrl: article.videoEmbedUrl,
    viewCount: 12000,
    readTime: article.readTime,
    breakingNews: Boolean(article.breakingNews),
    trending: Boolean(article.trending),
    featured: Boolean(article.featured),
    popular: Boolean(article.popular),
    category,
    subCategory: subCategory
      ? {
          id: subCategory.slug,
          name: subCategory.name,
          slug: subCategory.slug,
        }
      : null,
    author: mapDemoAuthor(article.authorSlug),
    tags: article.tagSlugs.map(mapDemoTag),
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    schemaType: article.schemaType,
  };
}

function mapPrismaArticle(article: ArticleWithRelations): PublicArticleSummary {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    publishAt: article.publishAt,
    updatedAt: article.updatedAt,
    featuredImageUrl: article.featuredImage?.url,
    featuredImageAlt: article.featuredImage?.altText,
    imageCaption: article.imageCaption,
    videoEmbedUrl: article.videoEmbedUrl,
    viewCount: article.viewCount,
    readTime: article.readTime,
    breakingNews: article.breakingNews,
    trending: article.trending,
    featured: article.featured,
    popular: article.popular,
    category: {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
      color: article.category.color,
      label: article.category.label,
    },
    subCategory: article.subCategory
      ? {
          id: article.subCategory.id,
          name: article.subCategory.name,
          slug: article.subCategory.slug,
        }
      : null,
    author: {
      id: article.author.id,
      displayName: article.author.displayName,
      slug: article.author.slug,
      title: article.author.title,
      bio: article.author.bio,
      avatarUrl: article.author.avatar?.url,
      twitterUrl: article.author.twitterUrl,
    },
    tags: article.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    schemaType: article.schemaType,
  };
}

function mapSectionSettings(value: Prisma.JsonValue | null | undefined): HomepageSectionSettings | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const settings = value as Record<string, unknown>;

  return {
    eyebrow: typeof settings.eyebrow === "string" ? settings.eyebrow : undefined,
    layout: typeof settings.layout === "string"
      ? (settings.layout as HomepageSectionSettings["layout"])
      : undefined,
    viewAllHref: typeof settings.viewAllHref === "string" ? settings.viewAllHref : undefined,
    viewAllLabel: typeof settings.viewAllLabel === "string" ? settings.viewAllLabel : undefined,
    promoText: typeof settings.promoText === "string" ? settings.promoText : undefined,
    ctaLabel: typeof settings.ctaLabel === "string" ? settings.ctaLabel : undefined,
    ctaHref: typeof settings.ctaHref === "string" ? settings.ctaHref : undefined,
  };
}

function removeUsedSectionItems(items: PublicArticleSummary[], usedSlugs: Set<string>) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (usedSlugs.has(item.slug) || seen.has(item.slug)) {
      return false;
    }

    seen.add(item.slug);
    return true;
  });
}

function mapPrismaAdSlot(slot: {
  id: string;
  key: string;
  name: string;
  placement: string;
  description: string | null;
  sponsorLabel: string | null;
  advertiserName: string | null;
  ctaLabel: string | null;
  codeHtml: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  positionKey: string | null;
  injectAfterParagraph: number | null;
  displayOrder: number;
  enabled?: boolean;
}): PublicAdSlot | null {
  if (!isRenderableAdSlot(slot)) {
    return null;
  }

  return {
    id: slot.id,
    key: slot.key,
    name: slot.name,
    placement: slot.placement,
    description: slot.description,
    sponsorLabel: slot.sponsorLabel,
    advertiserName: slot.advertiserName,
    ctaLabel: slot.ctaLabel,
    codeHtml: slot.codeHtml,
    imageUrl: slot.imageUrl,
    targetUrl: slot.targetUrl,
    positionKey: slot.positionKey,
    injectAfterParagraph: slot.injectAfterParagraph,
    displayOrder: slot.displayOrder,
  };
}

function mapDemoAdSlot(key: string): PublicAdSlot | null {
  const slot = demoAdSlots.find((item) => item.key === key);
  if (!slot || !isRenderableAdSlot(slot)) return null;

  return {
    id: slot.key,
    key: slot.key,
    name: slot.name,
    placement: slot.placement,
    description: slot.description,
    sponsorLabel: slot.sponsorLabel || null,
    advertiserName: slot.advertiserName || null,
    ctaLabel: slot.ctaLabel || null,
    codeHtml: slot.codeHtml || null,
    imageUrl: slot.imageUrl || null,
    targetUrl: slot.targetUrl || null,
    positionKey: slot.positionKey || null,
    injectAfterParagraph: slot.injectAfterParagraph ?? null,
    displayOrder: slot.displayOrder ?? 0,
  };
}

async function withFallback<T>(query: () => Promise<T>, fallback: () => T) {
  try {
    return await query();
  } catch {
    return fallback();
  }
}

function isRetryableCmsError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybeCode = "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const message = error instanceof Error ? error.message : String(error);

  return maybeCode === "P1001" || maybeCode === "P2028" || /can't reach database server|transaction not found|connection|timeout/i.test(message);
}

async function withCmsQueryRetries<T>(query: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await query();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryableCmsError(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 150));
    }
  }

  throw lastError;
}

async function withCachedQuery<T>(
  keyParts: string[],
  tags: string[],
  revalidate: number,
  query: () => Promise<T>,
) {
  return unstable_cache(query, keyParts, { tags, revalidate })();
}

export async function getHomepageData() {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-homepage-data-v2"],
        [
          CMS_CACHE_TAGS.articles,
          CMS_CACHE_TAGS.ads,
          CMS_CACHE_TAGS.homepage,
          CMS_CACHE_TAGS.homepageSections,
        ],
        CMS_CACHE_TTL.homepage,
        async () => {
      const [sections, publishedPool, mostRead] = await Promise.all([
        prisma.homepageSection.findMany({
          where: { enabled: true },
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
              include: {
                article: {
                  include: publicArticleInclude,
                },
                adSlot: true,
              },
            },
            adSlot: true,
          },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.article.findMany({
          where: { status: "PUBLISHED" },
          include: publicArticleInclude,
          orderBy: { publishAt: "desc" },
          take: 80,
        }),
        prisma.article.findMany({
          where: { status: "PUBLISHED" },
          include: publicArticleInclude,
          orderBy: { viewCount: "desc" },
          take: 12,
        }),
      ]);

      const mappedPool = publishedPool.map(mapPrismaArticle);
      const latest = mappedPool.slice(0, 12);
      const mostReadItems = mostRead.map(mapPrismaArticle);

      const usedSlugs = new Set<string>();
      const mappedSections: HomepageSectionData[] = sections.map((section) => {
        let items =
          section.sourceType === "MANUAL"
            ? section.items.flatMap((item) => (item.article ? [mapPrismaArticle(item.article)] : []))
            : [];

        if (!items.length) {
          items = selectAutomaticHomepageItems(
            {
              type: section.type,
              sourceType: section.sourceType,
              limit: section.limit,
              categoryId: section.categoryId,
              tagId: section.tagId,
            },
            {
              all: mappedPool,
              mostRead: mostReadItems,
            },
            {
              excludeSlugs: usedSlugs,
            },
          );
        }

        items = removeUsedSectionItems(items, usedSlugs);
        items.forEach((item) => usedSlugs.add(item.slug));

        return {
          key: section.key,
          type: section.type,
          title: section.title,
          description: section.description,
          items,
          adSlot: section.adSlot
            ? mapPrismaAdSlot(section.adSlot)
            : (() => {
                const inlineAd = section.items.find((item) => item.adSlot)?.adSlot;
                return inlineAd ? mapPrismaAdSlot(inlineAd) : null;
              })(),
          settings: mapSectionSettings(section.settings),
        };
      });

      return {
        sections: mappedSections,
        latest,
        mostRead: mostReadItems,
      };
        },
      ),
    () => {
      const latest = demoArticles.map(mapDemoArticle);
      const mostRead = latest.filter((item) => item.popular).concat(latest).slice(0, 12);
      const usedSlugs = new Set<string>();
      const sections: HomepageSectionData[] = demoHomepageSections.map((section) => {
        let items =
          section.sourceType === "MANUAL" && section.manualArticleSlugs?.length
            ? (section.manualArticleSlugs
                .map((slug) => latest.find((item) => item.slug === slug))
                .filter(Boolean) as PublicArticleSummary[])
            : selectAutomaticHomepageItems(
                {
                  type: section.type,
                  sourceType: section.sourceType,
                  limit: section.limit,
                  categoryId: section.categorySlug,
                  tagId: section.tagSlug,
                },
                {
                  all: latest,
                  mostRead,
                },
                {
                  excludeSlugs: usedSlugs,
                },
              );

        items = removeUsedSectionItems(items, usedSlugs);
        items.forEach((item) => usedSlugs.add(item.slug));

        return {
          key: section.key,
          type: section.type,
          title: section.title,
          description: section.description,
          items,
          adSlot: section.adSlotKey ? mapDemoAdSlot(section.adSlotKey) : null,
          settings: section.settings || null,
        };
      });

      return {
        sections,
        latest,
        mostRead: mostRead.slice(0, 5),
      };
    },
  );
}

export async function getLatestArticles(limit = 12) {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-latest-articles", String(limit)],
        [CMS_CACHE_TAGS.articles],
        CMS_CACHE_TTL.listing,
        async () => {
      const articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: publicArticleInclude,
        orderBy: { publishAt: "desc" },
        take: limit,
      });
      return articles.map(mapPrismaArticle);
        },
      ),
    () => demoArticles.slice(0, limit).map(mapDemoArticle),
  );
}

async function getArticleShellBySlugFromDatabase(slug: string): Promise<PublicArticleDetail | null> {
  const article =
    (await withCmsQueryRetries(() =>
      prisma.article.findUnique({
        where: { slug },
        include: publicArticleInclude,
      }),
    )) ||
    (await withCmsQueryRetries(() =>
      prisma.article.findFirst({
        where: { legacySlug: slug },
        include: publicArticleInclude,
      }),
    ));

  if (!article) return null;

  const base = mapPrismaArticle(article);
  return {
    ...base,
    contentHtml: article.contentHtml,
    canonicalUrl: article.canonicalUrl,
    allowComments: article.allowComments,
    related: [],
    comments: [],
  };
}

async function getArticleBySlugMinimal(slug: string): Promise<PublicArticleDetail | null> {
  const article =
    (await withCmsQueryRetries(() =>
      prisma.article.findUnique({
        where: { slug },
        include: {
          ...publicArticleInclude,
          comments: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      }),
    )) ||
    (await withCmsQueryRetries(() =>
      prisma.article.findFirst({
        where: { legacySlug: slug },
        include: {
          ...publicArticleInclude,
          comments: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      }),
    ));

  if (!article) return null;

  const base = mapPrismaArticle(article);
  return {
    ...base,
    contentHtml: article.contentHtml,
    canonicalUrl: article.canonicalUrl,
    allowComments: article.allowComments,
    related: [],
    comments: article.comments.map<PublicComment>((comment) => ({
      id: comment.id,
      authorName: comment.authorName,
      content: comment.content,
      createdAt: comment.createdAt,
    })),
  };
}

async function getArticleBySlugFromDatabase(slug: string): Promise<PublicArticleDetail | null> {
  const article =
    (await withCmsQueryRetries(() =>
      prisma.article.findUnique({
        where: { slug },
        include: {
          ...publicArticleInclude,
          comments: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
          },
          relatedFrom: {
            orderBy: { sortOrder: "asc" },
            take: 12,
            include: {
              targetArticle: {
                include: publicArticleInclude,
              },
            },
          },
        },
      }),
    )) ||
    (await withCmsQueryRetries(() =>
      prisma.article.findFirst({
        where: { legacySlug: slug },
        include: {
          ...publicArticleInclude,
          comments: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
          },
          relatedFrom: {
            orderBy: { sortOrder: "asc" },
            take: 12,
            include: {
              targetArticle: {
                include: publicArticleInclude,
              },
            },
          },
        },
      }),
    ));

  if (!article) return null;

  const base = mapPrismaArticle(article);
  const manualRelated = article.relatedFrom
    .filter((relation) => relation.targetArticle.status === "PUBLISHED")
    .map((relation) => mapPrismaArticle(relation.targetArticle));
  const excludedIds = [article.id, ...manualRelated.map((item) => item.id).filter(Boolean)] as string[];
  const tagIds = article.tags.map((item) => item.tagId);

  const [sharedTagCandidates, categoryCandidates, latestCandidates] = await Promise.all([
    tagIds.length
      ? withCmsQueryRetries(() =>
          prisma.article.findMany({
            where: {
              id: { notIn: excludedIds },
              status: "PUBLISHED",
              tags: { some: { tagId: { in: tagIds } } },
            },
            include: publicArticleInclude,
            orderBy: [{ publishAt: "desc" }, { viewCount: "desc" }],
            take: 18,
          }),
        )
      : Promise.resolve([]),
    withCmsQueryRetries(() =>
      prisma.article.findMany({
        where: {
          id: { notIn: excludedIds },
          status: "PUBLISHED",
          OR: [
            ...(article.subCategoryId
              ? [{ subCategoryId: article.subCategoryId } as const]
              : []),
            { categoryId: article.categoryId },
          ],
        },
        include: publicArticleInclude,
        orderBy: [{ publishAt: "desc" }, { viewCount: "desc" }],
        take: 18,
      }),
    ),
    withCmsQueryRetries(() =>
      prisma.article.findMany({
        where: {
          id: { notIn: excludedIds },
          status: "PUBLISHED",
        },
        include: publicArticleInclude,
        orderBy: [
          { featured: "desc" },
          { trending: "desc" },
          { popular: "desc" },
          { publishAt: "desc" },
        ],
        take: 18,
      }),
    ),
  ]);

  const related = resolveRelatedStories({
    article: base,
    manual: manualRelated,
    automatic: [...sharedTagCandidates, ...categoryCandidates, ...latestCandidates].map(mapPrismaArticle),
    mode: article.relatedContentMode,
    limit: article.relatedContentLimit,
  });

  return {
    ...base,
    contentHtml: article.contentHtml,
    canonicalUrl: article.canonicalUrl,
    allowComments: article.allowComments,
    related,
    comments: article.comments.map<PublicComment>((comment) => ({
      id: comment.id,
      authorName: comment.authorName,
      content: comment.content,
      createdAt: comment.createdAt,
    })),
  };
}

function getDemoArticleBySlug(slug: string): PublicArticleDetail | null {
  const article = demoArticles.find((item) => item.slug === slug);
  if (!article) return null;
  const base = mapDemoArticle(article);
  const automaticPool = demoArticles
    .filter((item) => item.slug !== slug)
    .map(mapDemoArticle);
  return {
    ...base,
    contentHtml: article.contentHtml,
    canonicalUrl: null,
    allowComments: true,
    related: resolveRelatedStories({
      article: base,
      manual: [],
      automatic: automaticPool,
      mode: "HYBRID",
      limit: 4,
    }),
    comments: demoComments
      .filter((comment) => comment.articleSlug === slug && comment.status === "APPROVED")
      .map((comment, index) => ({
        id: `${slug}-${index}`,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: new Date(),
      })),
  };
}

export async function getArticleShellBySlug(slug: string): Promise<PublicArticleDetail | null> {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-article-shell-v1", slug],
        [CMS_CACHE_TAGS.articles, cmsCacheTag.article(slug)],
        CMS_CACHE_TTL.article,
        async () => getArticleShellBySlugFromDatabase(slug),
      ),
    () => getDemoArticleBySlug(slug),
  );
}

export async function getArticleBySlug(slug: string): Promise<PublicArticleDetail | null> {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-article-detail-v1", slug],
        [
          CMS_CACHE_TAGS.articles,
          CMS_CACHE_TAGS.comments,
          cmsCacheTag.article(slug),
          cmsCacheTag.articleComments(slug),
        ],
        CMS_CACHE_TTL.article,
        async () => {
          try {
            return await getArticleBySlugFromDatabase(slug);
          } catch {
            return await getArticleBySlugMinimal(slug);
          }
        },
      ),
    () => getDemoArticleBySlug(slug),
  );
}

export async function getCategoryPageData(slug: string) {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-category-page", slug],
        [CMS_CACHE_TAGS.articles, CMS_CACHE_TAGS.categories, cmsCacheTag.category(slug)],
        CMS_CACHE_TTL.listing,
        async () => {
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          subcategories: {
            orderBy: { sortOrder: "asc" },
          },
          articles: {
            where: { status: "PUBLISHED" },
            include: publicArticleInclude,
            orderBy: { publishAt: "desc" },
            take: 24,
          },
        },
      });

      if (!category) return null;

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          color: category.color,
          label: category.label,
        },
        description: category.description,
        subcategories: category.subcategories.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
        })),
        articles: category.articles.map(mapPrismaArticle),
      };
        },
      ),
    () => {
      const category = demoCategories.find((item) => item.slug === slug);
      if (!category) return null;
      return {
        category: {
          id: category.slug,
          name: category.name,
          slug: category.slug,
          color: category.color,
          label: category.label,
        },
        description: category.description,
        subcategories: category.subcategories.map((item) => ({
          id: item.slug,
          name: item.name,
          slug: item.slug,
        })),
        articles: demoArticles.filter((item) => item.categorySlug === slug).map(mapDemoArticle),
      };
    },
  );
}

export async function getSubCategoryPageData(categorySlug: string, subSlug: string) {
  const category = await getCategoryPageData(categorySlug);
  if (!category) return null;

  return {
    ...category,
    activeSubCategory: category.subcategories.find((item) => item.slug === subSlug) || null,
    articles: category.articles.filter((item) => item.subCategory?.slug === subSlug),
  };
}

export async function getTagPageData(slug: string) {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-tag-page", slug],
        [CMS_CACHE_TAGS.articles, CMS_CACHE_TAGS.tags, cmsCacheTag.tag(slug)],
        CMS_CACHE_TTL.listing,
        async () => {
      const [tag, articles] = await Promise.all([
        prisma.tag.findUnique({
          where: { slug },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        }),
        prisma.article.findMany({
          where: {
            status: "PUBLISHED",
            tags: {
              some: {
                tag: {
                  slug,
                },
              },
            },
          },
          include: publicArticleInclude,
          orderBy: { publishAt: "desc" },
          take: 24,
        }),
      ]);

      if (!tag) return null;

      return {
        tag: { id: tag.id, name: tag.name, slug: tag.slug },
        articles: articles.map(mapPrismaArticle),
      };
        },
      ),
    () => {
      const tag = demoTags.find((item) => item.slug === slug);
      if (!tag) return null;
      return {
        tag: {
          id: tag.slug,
          name: tag.name,
          slug: tag.slug,
        },
        articles: demoArticles
          .filter((item) => item.tagSlugs.includes(slug))
          .slice(0, 24)
          .map(mapDemoArticle),
      };
    },
  );
}

export async function getAuthorPageData(slug: string) {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-author-page", slug],
        [CMS_CACHE_TAGS.articles, CMS_CACHE_TAGS.authors, cmsCacheTag.author(slug)],
        CMS_CACHE_TTL.listing,
        async () => {
      const author = await prisma.authorProfile.findUnique({
        where: { slug },
        include: {
          avatar: true,
          articles: {
            where: { status: "PUBLISHED" },
            include: publicArticleInclude,
            orderBy: { publishAt: "desc" },
            take: 24,
          },
        },
      });

      if (!author) return null;

      return {
        author: {
          id: author.id,
          displayName: author.displayName,
          slug: author.slug,
          title: author.title,
          bio: author.bio,
          avatarUrl: author.avatar?.url,
          twitterUrl: author.twitterUrl,
        },
        articles: author.articles.map(mapPrismaArticle),
      };
        },
      ),
    () => {
      const author = demoAuthors.find((item) => item.slug === slug);
      if (!author) return null;
      return {
        author: mapDemoAuthor(slug),
        articles: demoArticles
          .filter((item) => item.authorSlug === slug)
          .slice(0, 24)
          .map(mapDemoArticle),
      };
    },
  );
}

export async function getVideoHighlights() {
  const latest = await getLatestArticles(24);
  return latest.filter((item) => item.videoEmbedUrl).slice(0, 8);
}

export async function getPublishedPageBySlug(slug: string): Promise<PublicPage | null> {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-page", slug],
        [CMS_CACHE_TAGS.pages, cmsCacheTag.page(slug)],
        CMS_CACHE_TTL.page,
        async () => {
      const page = await prisma.page.findFirst({
        where: { slug, status: "PUBLISHED" },
      });
      if (!page) return null;
      return {
        id: page.id,
        slug: page.slug,
        title: page.title,
        summary: page.summary,
        contentHtml: page.contentHtml,
        seoTitle: page.seoTitle,
        metaDescription: page.metaDescription,
        canonicalUrl: page.canonicalUrl,
        schemaType: page.schemaType,
      };
        },
      ),
    () => {
      const page = demoPages.find((item) => item.slug === slug);
      if (!page) return null;
      return {
        id: page.slug,
        slug: page.slug,
        title: page.title,
        summary: page.summary,
        contentHtml: page.contentHtml,
        seoTitle: page.seoTitle,
        metaDescription: page.metaDescription,
        canonicalUrl: null,
        schemaType: "WebPage",
      };
    },
  );
}

export async function searchPublishedArticles(query: string) {
  if (!query.trim()) return [] as PublicArticleSummary[];
  const needle = query.toLowerCase();

  return withFallback(
    async () => {
      const articles = await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { contentText: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
            { author: { displayName: { contains: query, mode: "insensitive" } } },
            { tags: { some: { tag: { name: { contains: query, mode: "insensitive" } } } } },
          ],
        },
        include: publicArticleInclude,
        orderBy: { publishAt: "desc" },
        take: 40,
      });
      return articles.map(mapPrismaArticle);
    },
    () =>
      demoArticles
        .filter((article) => {
          const haystack = [
            article.title,
            article.excerpt,
            article.contentText,
            article.categorySlug,
            article.authorSlug,
            ...article.tagSlugs,
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(needle);
        })
        .map(mapDemoArticle),
  );
}

export async function searchPublishedArticlesPage(query: string, page = 1, pageSize = 12) {
  const normalizedQuery = query.trim();
  const normalizedPage = Math.max(page, 1);

  if (!normalizedQuery) {
    return {
      total: 0,
      page: normalizedPage,
      pageSize,
      results: [] as PublicArticleSummary[],
    };
  }

  const needle = normalizedQuery.toLowerCase();
  const skip = (normalizedPage - 1) * pageSize;

  return withFallback(
    async () => {
      const where: Prisma.ArticleWhereInput = {
        status: "PUBLISHED",
        OR: [
          { title: { contains: normalizedQuery, mode: "insensitive" } },
          { excerpt: { contains: normalizedQuery, mode: "insensitive" } },
          { contentText: { contains: normalizedQuery, mode: "insensitive" } },
          { category: { name: { contains: normalizedQuery, mode: "insensitive" } } },
          { author: { displayName: { contains: normalizedQuery, mode: "insensitive" } } },
          { tags: { some: { tag: { name: { contains: normalizedQuery, mode: "insensitive" } } } } },
        ],
      };

      const [total, articles] = await Promise.all([
        prisma.article.count({ where }),
        prisma.article.findMany({
          where,
          include: publicArticleInclude,
          orderBy: { publishAt: "desc" },
          skip,
          take: pageSize,
        }),
      ]);

      return {
        total,
        page: normalizedPage,
        pageSize,
        results: articles.map(mapPrismaArticle),
      };
    },
    () => {
      const allResults = demoArticles
        .filter((article) => {
          const haystack = [
            article.title,
            article.excerpt,
            article.contentText,
            article.categorySlug,
            article.authorSlug,
            ...article.tagSlugs,
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(needle);
        })
        .map(mapDemoArticle);

      return {
        total: allResults.length,
        page: normalizedPage,
        pageSize,
        results: allResults.slice(skip, skip + pageSize),
      };
    },
  );
}

export async function getRedirectForPath(pathname: string) {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-redirect", pathname],
        [CMS_CACHE_TAGS.redirects],
        CMS_CACHE_TTL.redirect,
        () => prisma.redirect.findFirst({ where: { sourcePath: pathname, active: true } }),
      ),
    () => {
      const redirect = demoRedirects.find((item) => item.sourcePath === pathname);
      if (!redirect) return null;
      const now = new Date();
      return {
        id: redirect.sourcePath,
        sourcePath: redirect.sourcePath,
        destinationPath: redirect.destinationPath,
        statusCode: redirect.statusCode,
        notes: redirect.notes || null,
        active: true,
        hits: 0,
        createdAt: now,
        updatedAt: now,
      };
    },
  );
}

export async function getAdSlotByKey(key: string) {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-ad-slot", key],
        [CMS_CACHE_TAGS.ads, cmsCacheTag.adKey(key)],
        CMS_CACHE_TTL.chrome,
        async () => {
      const slot = await prisma.adSlot.findUnique({ where: { key } });
      return slot ? mapPrismaAdSlot(slot) : null;
        },
      ),
    () => mapDemoAdSlot(key),
  );
}

export async function getAdSlotsByPlacement(placement: string, positionKey?: string) {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-ad-slots-v2", placement, positionKey || "all"],
        [CMS_CACHE_TAGS.ads, cmsCacheTag.adPlacement(placement, positionKey)],
        CMS_CACHE_TTL.chrome,
        async () => {
      const slots = await prisma.adSlot.findMany({
        where: {
          placement: placement as AdPlacement,
          enabled: true,
          OR: [{ codeHtml: { not: null } }, { imageUrl: { not: null } }],
          ...(positionKey ? { positionKey } : {}),
        },
        orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
      });

      return slots.map(mapPrismaAdSlot).filter(Boolean) as PublicAdSlot[];
        },
      ),
    () =>
      demoAdSlots
        .filter(
          (slot) =>
            slot.placement === placement && (!positionKey || slot.positionKey === positionKey),
        )
        .sort(
          (left, right) =>
            (left.displayOrder ?? 0) - (right.displayOrder ?? 0),
        )
        .map((slot) => mapDemoAdSlot(slot.key)!)
        .filter(Boolean),
  );
}

export async function getNavigationCategories() {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-navigation-categories"],
        [CMS_CACHE_TAGS.categories, CMS_CACHE_TAGS.chrome],
        CMS_CACHE_TTL.chrome,
        async () =>
          sortNavigationCategories(
            await prisma.category.findMany({
              where: {
                articles: {
                  some: {
                    status: "PUBLISHED",
                  },
                },
              },
              select: { name: true, slug: true, label: true, sortOrder: true },
            }),
          ),
      ),
    () => sortNavigationCategories(demoCategories.map((category) => ({ name: category.name, slug: category.slug, label: category.label }))),
  );
}

export async function getSiteChromeData() {
  return withFallback(
    () =>
      withCachedQuery(
        ["public-site-chrome-v2"],
        [CMS_CACHE_TAGS.ads, CMS_CACHE_TAGS.categories, CMS_CACHE_TAGS.chrome],
        CMS_CACHE_TTL.chrome,
        async () => {
      const [categories, ads] = await Promise.all([
        prisma.category.findMany({
          where: {
            articles: {
              some: {
                status: "PUBLISHED",
              },
            },
          },
          select: { name: true, slug: true, label: true, sortOrder: true },
        }),
        prisma.adSlot.findMany({
          where: {
            enabled: true,
            placement: { in: ["HEADER", "FOOTER"] },
            OR: [{ codeHtml: { not: null } }, { imageUrl: { not: null } }],
          },
          orderBy: [{ placement: "asc" }, { displayOrder: "asc" }, { updatedAt: "desc" }],
        }),
      ]);

      const headerSlot = ads.find((slot) => slot.placement === "HEADER");
      const footerSlot = ads.find((slot) => slot.placement === "FOOTER");

      return {
        categories: sortNavigationCategories(categories),
        headerAd: headerSlot ? mapPrismaAdSlot(headerSlot) : null,
        footerAd: footerSlot ? mapPrismaAdSlot(footerSlot) : null,
      };
        },
      ),
    () => ({
      categories: sortNavigationCategories(
        demoCategories.map((category) => ({ name: category.name, slug: category.slug, label: category.label })),
      ),
      headerAd: null,
      footerAd: null,
    }),
  );
}
