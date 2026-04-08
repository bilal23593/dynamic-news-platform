export type WordpressCategoryRef = {
  name: string;
  slug?: string;
  domain: "category" | "post_tag";
};

export type WordpressMediaRef = {
  url: string;
  title?: string;
};

export type WordpressPostRecord = {
  sourceId: string;
  title: string;
  slug: string;
  excerpt?: string;
  html: string;
  publishDate?: string;
  authorName?: string;
  status?: string;
  categories: WordpressCategoryRef[];
  media: WordpressMediaRef[];
  featuredImageUrl?: string;
  legacyUrl?: string;
};

export type WordpressImportInput = {
  format: "xml" | "json" | "csv";
  payload: string;
  sourceUrl?: string;
};

export type WordpressDryRunResult = {
  title: string;
  postsDetected: number;
  categoriesDetected: number;
  tagsDetected: number;
  authorsDetected: number;
  mediaDetected: number;
  duplicatesFlagged: number;
  previewTitles: string[];
  warnings: string[];
};

