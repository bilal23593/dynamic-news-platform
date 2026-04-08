import type { PublicArticleSummary } from "@/types/cms";

export type AutomaticSectionInput = {
  type: string;
  sourceType: string;
  limit: number;
  categoryId?: string | null;
  tagId?: string | null;
};

type HomepageSelectionContext = {
  all: PublicArticleSummary[];
  mostRead: PublicArticleSummary[];
};

export const homepageSelectionRules = [
  {
    section: "Top Stories / Hero",
    appliesTo: "Section type `HERO`",
    rule:
      "Published stories where at least one of these is true: `breakingNews`, `featured`, `trending`, or `popular`.",
    ranking:
      "Sort by `breakingNews` first, then `featured`, then `trending`, then `popular`, then newest `publishAt`, then highest `viewCount`.",
    fallback: "If no flagged stories exist, use the newest published stories.",
  },
  {
    section: "Breaking Strip",
    appliesTo: "Source type `BREAKING`",
    rule: "Published stories with `breakingNews = true`.",
    ranking: "Newest `publishAt` first, then highest `viewCount`.",
    fallback: "If no breaking stories exist, the strip shows nothing until editors flag one.",
  },
  {
    section: "Latest News",
    appliesTo: "Source type `LATEST`",
    rule: "All published stories.",
    ranking: "Newest `publishAt` first.",
    fallback: "Always falls back to the newest published stories.",
  },
  {
    section: "Trending",
    appliesTo: "Source type `TRENDING`",
    rule: "Published stories with `trending = true`.",
    ranking: "Highest `viewCount` first, then newest `publishAt`, then `breakingNews` tie-break.",
    fallback: "If no stories are marked trending, use the newest high-priority stories.",
  },
  {
    section: "Most Read",
    appliesTo: "Source type `MOST_READ`",
    rule: "Published stories ranked by readership, with `popular = true` given priority.",
    ranking: "Sort by `popular`, then `viewCount`, then newest `publishAt`.",
    fallback: "Falls back to overall highest `viewCount` among published stories.",
  },
  {
    section: "Featured",
    appliesTo: "Source type `FEATURED`",
    rule:
      "Published stories where `featured = true`. For hero modules this also considers `breakingNews`, `trending`, and `popular` to keep the lineup newsroom-driven.",
    ranking: "Hero uses top-story ranking. Other sections use newest `publishAt` first.",
    fallback: "If there are not enough featured stories, fill from newest published stories.",
  },
  {
    section: "Category Blocks",
    appliesTo: "Source type `CATEGORY`",
    rule: "Published stories whose `category` matches the selected category.",
    ranking: "Newest `publishAt` first.",
    fallback: "If no stories match the category, the block stays empty until content is tagged correctly.",
  },
  {
    section: "Tag Blocks",
    appliesTo: "Source type `TAG`",
    rule: "Published stories containing the selected tag, such as `consumer` or `health`.",
    ranking: "Newest `publishAt` first.",
    fallback: "If no stories carry that tag, the block stays empty until editors add it.",
  },
  {
    section: "Video Highlights",
    appliesTo: "Source type `VIDEO`",
    rule: "Published stories with a `videoEmbedUrl`.",
    ranking: "Newest `publishAt` first.",
    fallback: "If no stories have video, the module stays empty.",
  },
  {
    section: "Manual",
    appliesTo: "Source type `MANUAL`",
    rule: "Editors explicitly choose the stories in Homepage Builder.",
    ranking: "Manual order from the admin multi-select is preserved.",
    fallback: "No automatic fallback. Editors control the list completely.",
  },
] as const;

export function getAutomaticSelectionReasons(
  article: PublicArticleSummary,
  section: AutomaticSectionInput,
) {
  const reasons: string[] = [];

  if (section.type === "HERO") {
    if (article.breakingNews) reasons.push("Breaking");
    if (article.featured) reasons.push("Featured");
    if (article.trending) reasons.push("Trending");
    if (article.popular) reasons.push("Most Read");
    return reasons.length ? reasons : ["Latest Fallback"];
  }

  switch (section.sourceType) {
    case "BREAKING":
      return article.breakingNews ? ["Breaking"] : ["Not breaking"];
    case "LATEST":
      return ["Latest"];
    case "TRENDING":
      return article.trending ? ["Trending"] : ["Fallback"];
    case "MOST_READ":
      return article.popular ? ["Most Read", "Popular Flag"] : ["High Views"];
    case "FEATURED":
      return article.featured ? ["Featured"] : ["Latest Fallback"];
    case "CATEGORY":
      return [`Category: ${article.category.name}`];
    case "TAG": {
      const matches = article.tags
        .filter((tag) => tag.id === section.tagId)
        .map((tag) => `Tag: ${tag.name}`);

      return matches.length ? matches : ["Tag Match"];
    }
    case "VIDEO":
      return article.videoEmbedUrl ? ["Video"] : ["No video"];
    case "MANUAL":
      return ["Manual Pick"];
    default:
      return [];
  }
}

function publishTime(value: Date | string) {
  return new Date(value).getTime();
}

function sortNewest(items: PublicArticleSummary[]) {
  return [...items].sort((left, right) => {
    return publishTime(right.publishAt) - publishTime(left.publishAt) || right.viewCount - left.viewCount;
  });
}

function sortMostRead(items: PublicArticleSummary[]) {
  return [...items].sort((left, right) => {
    return (
      Number(right.popular) - Number(left.popular) ||
      right.viewCount - left.viewCount ||
      publishTime(right.publishAt) - publishTime(left.publishAt)
    );
  });
}

function sortTrending(items: PublicArticleSummary[]) {
  return [...items].sort((left, right) => {
    return (
      Number(right.trending) - Number(left.trending) ||
      right.viewCount - left.viewCount ||
      publishTime(right.publishAt) - publishTime(left.publishAt) ||
      Number(right.breakingNews) - Number(left.breakingNews)
    );
  });
}

function sortTopStories(items: PublicArticleSummary[]) {
  return [...items].sort((left, right) => {
    return (
      Number(right.breakingNews) - Number(left.breakingNews) ||
      Number(right.featured) - Number(left.featured) ||
      Number(right.trending) - Number(left.trending) ||
      Number(right.popular) - Number(left.popular) ||
      publishTime(right.publishAt) - publishTime(left.publishAt) ||
      right.viewCount - left.viewCount
    );
  });
}

function uniqueBySlug(items: PublicArticleSummary[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

export function selectAutomaticHomepageItems(
  section: AutomaticSectionInput,
  context: HomepageSelectionContext,
) {
  const latest = sortNewest(context.all);
  const limit = section.limit;

  if (section.type === "HERO") {
    const candidates = context.all.filter(
      (item) => item.breakingNews || item.featured || item.trending || item.popular,
    );

    return uniqueBySlug(
      sortTopStories(candidates).concat(latest),
    ).slice(0, limit);
  }

  switch (section.sourceType) {
    case "LATEST":
      return latest.slice(0, limit);
    case "BREAKING":
      return sortNewest(context.all.filter((item) => item.breakingNews)).slice(0, limit);
    case "TRENDING": {
      const candidates = context.all.filter((item) => item.trending);
      return uniqueBySlug(sortTrending(candidates).concat(sortTopStories(latest))).slice(0, limit);
    }
    case "MOST_READ":
      return uniqueBySlug(sortMostRead(context.mostRead).concat(sortMostRead(context.all))).slice(0, limit);
    case "FEATURED": {
      const candidates = context.all.filter((item) => item.featured);
      return uniqueBySlug(sortNewest(candidates).concat(latest)).slice(0, limit);
    }
    case "VIDEO":
      return sortNewest(context.all.filter((item) => Boolean(item.videoEmbedUrl))).slice(0, limit);
    case "CATEGORY":
      return sortNewest(
        context.all.filter((item) => item.category.id === section.categoryId),
      ).slice(0, limit);
    case "TAG":
      return sortNewest(
        context.all.filter((item) => item.tags.some((tag) => tag.id === section.tagId)),
      ).slice(0, limit);
    default:
      return [];
  }
}
