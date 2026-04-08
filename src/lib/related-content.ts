import type { PublicArticleSummary } from "@/types/cms";

export type RelatedContentMode = "AUTOMATIC" | "MANUAL" | "HYBRID";

function publishTime(value: Date | string) {
  return new Date(value).getTime();
}

function uniqueBySlug(items: PublicArticleSummary[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function sharedTagCount(base: PublicArticleSummary, candidate: PublicArticleSummary) {
  const baseTags = new Set(base.tags.map((tag) => tag.id || tag.slug));
  return candidate.tags.filter((tag) => baseTags.has(tag.id || tag.slug)).length;
}

function scoreCandidate(base: PublicArticleSummary, candidate: PublicArticleSummary) {
  const sameSubCategory =
    Boolean(base.subCategory?.slug) && base.subCategory?.slug === candidate.subCategory?.slug;
  const sameCategory = base.category.slug === candidate.category.slug;
  const sharedTags = sharedTagCount(base, candidate);

  return (
    sharedTags * 100 +
    Number(sameSubCategory) * 28 +
    Number(sameCategory) * 14 +
    Number(candidate.featured) * 6 +
    Number(candidate.trending) * 6 +
    Number(candidate.popular) * 4 +
    Number(candidate.breakingNews) * 3 +
    candidate.viewCount / 2000 +
    publishTime(candidate.publishAt) / 1_000_000_000_000
  );
}

function rankAutomatic(base: PublicArticleSummary, candidates: PublicArticleSummary[]) {
  return [...candidates].sort((left, right) => {
    return (
      scoreCandidate(base, right) - scoreCandidate(base, left) ||
      publishTime(right.publishAt) - publishTime(left.publishAt) ||
      right.viewCount - left.viewCount
    );
  });
}

export function resolveRelatedStories(input: {
  article: PublicArticleSummary;
  manual: PublicArticleSummary[];
  automatic: PublicArticleSummary[];
  limit?: number;
  mode?: RelatedContentMode | null;
}) {
  const limit = Math.max(input.limit || 4, 1);
  const manual = uniqueBySlug(input.manual).filter((item) => item.slug !== input.article.slug);
  const automatic = uniqueBySlug(input.automatic).filter((item) => item.slug !== input.article.slug);
  const mode = input.mode || "HYBRID";

  if (mode === "MANUAL" && manual.length) {
    return manual.slice(0, limit);
  }

  if (mode === "AUTOMATIC") {
    return rankAutomatic(input.article, automatic).slice(0, limit);
  }

  const rankedAutomatic = rankAutomatic(
    input.article,
    automatic.filter((candidate) => !manual.some((item) => item.slug === candidate.slug)),
  );

  if (mode === "MANUAL") {
    return rankedAutomatic.slice(0, limit);
  }

  return uniqueBySlug([...manual, ...rankedAutomatic]).slice(0, limit);
}
