export type PublicCategory = {
  id?: string;
  name: string;
  slug: string;
  color?: string | null;
  label?: string | null;
};

export type PublicSubCategory = {
  id?: string;
  name: string;
  slug: string;
};

export type PublicTag = {
  id?: string;
  name: string;
  slug: string;
};

export type PublicAuthor = {
  id?: string;
  displayName: string;
  slug: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  twitterUrl?: string | null;
};

export type PublicComment = {
  id?: string;
  authorName: string;
  content: string;
  createdAt: Date | string;
};

export type PublicArticleSummary = {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string;
  publishAt: Date | string;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  imageCaption?: string | null;
  videoEmbedUrl?: string | null;
  viewCount: number;
  readTime: number;
  breakingNews: boolean;
  trending: boolean;
  featured: boolean;
  popular: boolean;
  category: PublicCategory;
  subCategory?: PublicSubCategory | null;
  author: PublicAuthor;
  tags: PublicTag[];
  seoTitle?: string | null;
  metaDescription?: string | null;
};

export type PublicArticleDetail = PublicArticleSummary & {
  contentHtml: string;
  canonicalUrl?: string | null;
  related: PublicArticleSummary[];
  comments: PublicComment[];
  allowComments: boolean;
};

export type PublicPage = {
  id?: string;
  slug: string;
  title: string;
  summary?: string | null;
  contentHtml: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
};

export type PublicAdSlot = {
  id?: string;
  key: string;
  name: string;
  placement: string;
  description?: string | null;
  sponsorLabel?: string | null;
  advertiserName?: string | null;
  ctaLabel?: string | null;
  codeHtml?: string | null;
  imageUrl?: string | null;
  targetUrl?: string | null;
  positionKey?: string | null;
  injectAfterParagraph?: number | null;
  displayOrder?: number;
};

export type HomepageSectionSettings = {
  eyebrow?: string;
  layout?: "cards" | "dense" | "split" | "compact" | "utility" | "weather";
  viewAllHref?: string;
  viewAllLabel?: string;
  promoText?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type HomepageSectionData = {
  key: string;
  type: string;
  title: string;
  description?: string | null;
  items: PublicArticleSummary[];
  adSlot?: PublicAdSlot | null;
  settings?: HomepageSectionSettings | null;
};
