import { updateTag } from "next/cache";

export const CMS_CACHE_TTL = {
  article: 120,
  homepage: 180,
  listing: 300,
  chrome: 900,
  page: 900,
  redirect: 900,
  sitemap: 1800,
} as const;

export const CMS_CACHE_TAGS = {
  ads: "cms:ads",
  articles: "cms:articles",
  authors: "cms:authors",
  categories: "cms:categories",
  chrome: "cms:chrome",
  comments: "cms:comments",
  homepage: "cms:homepage",
  homepageSections: "cms:homepage-sections",
  pages: "cms:pages",
  redirects: "cms:redirects",
  tags: "cms:tags",
} as const;

export const cmsCacheTag = {
  adKey: (key: string) => `cms:ad:${key}`,
  adPlacement: (placement: string, positionKey?: string | null) =>
    `cms:ads:${placement.toLowerCase()}:${positionKey || "all"}`,
  article: (slug: string) => `cms:article:${slug}`,
  articleComments: (slug: string) => `cms:article-comments:${slug}`,
  author: (slug: string) => `cms:author:${slug}`,
  category: (slug: string) => `cms:category:${slug}`,
  page: (slug: string) => `cms:page:${slug}`,
  tag: (slug: string) => `cms:tag:${slug}`,
} as const;

type RefreshArticleInput = {
  slug?: string | null;
  categorySlug?: string | null;
  authorSlug?: string | null;
  tagSlugs?: string[];
};

function updateCmsTag(tag: string | null | undefined) {
  if (tag) {
    updateTag(tag);
  }
}

export function refreshArticleCaches(input: RefreshArticleInput = {}) {
  updateCmsTag(CMS_CACHE_TAGS.articles);
  updateCmsTag(CMS_CACHE_TAGS.comments);
  updateCmsTag(CMS_CACHE_TAGS.homepage);
  updateCmsTag(CMS_CACHE_TAGS.homepageSections);

  updateCmsTag(input.slug ? cmsCacheTag.article(input.slug) : null);
  updateCmsTag(input.slug ? cmsCacheTag.articleComments(input.slug) : null);
  updateCmsTag(input.categorySlug ? cmsCacheTag.category(input.categorySlug) : null);
  updateCmsTag(input.authorSlug ? cmsCacheTag.author(input.authorSlug) : null);

  for (const tagSlug of input.tagSlugs || []) {
    updateCmsTag(cmsCacheTag.tag(tagSlug));
  }
}

export function refreshCategoryCaches(categorySlugs: string[] = []) {
  updateCmsTag(CMS_CACHE_TAGS.articles);
  updateCmsTag(CMS_CACHE_TAGS.categories);
  updateCmsTag(CMS_CACHE_TAGS.chrome);
  updateCmsTag(CMS_CACHE_TAGS.homepage);
  updateCmsTag(CMS_CACHE_TAGS.homepageSections);

  for (const slug of categorySlugs) {
    updateCmsTag(cmsCacheTag.category(slug));
  }
}

export function refreshTagCaches(tagSlugs: string[] = []) {
  updateCmsTag(CMS_CACHE_TAGS.articles);
  updateCmsTag(CMS_CACHE_TAGS.tags);
  updateCmsTag(CMS_CACHE_TAGS.homepage);
  updateCmsTag(CMS_CACHE_TAGS.homepageSections);

  for (const slug of tagSlugs) {
    updateCmsTag(cmsCacheTag.tag(slug));
  }
}

export function refreshAuthorCaches(authorSlugs: string[] = []) {
  updateCmsTag(CMS_CACHE_TAGS.authors);
  updateCmsTag(CMS_CACHE_TAGS.articles);
  updateCmsTag(CMS_CACHE_TAGS.homepage);
  updateCmsTag(CMS_CACHE_TAGS.homepageSections);

  for (const slug of authorSlugs) {
    updateCmsTag(cmsCacheTag.author(slug));
  }
}

export function refreshPageCaches(pageSlugs: string[] = []) {
  updateCmsTag(CMS_CACHE_TAGS.pages);

  for (const slug of pageSlugs) {
    updateCmsTag(cmsCacheTag.page(slug));
  }
}

export function refreshHomepageCaches() {
  updateCmsTag(CMS_CACHE_TAGS.homepage);
  updateCmsTag(CMS_CACHE_TAGS.homepageSections);
}

export function refreshRedirectCaches() {
  updateCmsTag(CMS_CACHE_TAGS.redirects);
}

export function refreshAdCaches(slot?: {
  key?: string | null;
  placement?: string | null;
  positionKey?: string | null;
}) {
  updateCmsTag(CMS_CACHE_TAGS.ads);
  updateCmsTag(CMS_CACHE_TAGS.chrome);
  updateCmsTag(CMS_CACHE_TAGS.homepage);
  updateCmsTag(CMS_CACHE_TAGS.homepageSections);

  updateCmsTag(slot?.key ? cmsCacheTag.adKey(slot.key) : null);
  updateCmsTag(
    slot?.placement ? cmsCacheTag.adPlacement(slot.placement, slot.positionKey) : null,
  );
  updateCmsTag(slot?.placement ? cmsCacheTag.adPlacement(slot.placement) : null);
}
