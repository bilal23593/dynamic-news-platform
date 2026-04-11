import { slugify } from "@/lib/utils";

export const CANONICAL_CATEGORY_SLUGS = [
  "business-economy",
  "crime",
  "entertainment",
  "local-news",
  "politics",
  "sports",
  "technology",
  "weather",
  "world",
] as const;

export type CanonicalCategorySlug = (typeof CANONICAL_CATEGORY_SLUGS)[number];

type CategoryRule = {
  titleKeywords: string[];
  tagKeywords: string[];
};

export type CategoryInferenceInput = {
  title: string;
  excerpt?: string | null;
  contentText?: string | null;
  currentCategorySlug?: string | null;
  tagSlugs?: string[];
  tagNames?: string[];
};

export type CategoryInferenceResult = {
  currentCategorySlug: string | null;
  suggestedCategorySlug: CanonicalCategorySlug | null;
  resolvedCategorySlug: string | null;
  scores: Record<CanonicalCategorySlug, number>;
  shouldReassign: boolean;
};

const BROAD_CATEGORY_SLUGS = new Set<string>(["crime", "local-news", "world"]);
const SPECIALIZED_CATEGORY_SLUGS = new Set<string>([
  "business-economy",
  "entertainment",
  "politics",
  "sports",
  "technology",
  "weather",
]);

const CATEGORY_RULES: Record<CanonicalCategorySlug, CategoryRule> = {
  "business-economy": {
    titleKeywords: [
      "business",
      "economy",
      "economic",
      "inflation",
      "tariff",
      "tariffs",
      "stock",
      "stocks",
      "market",
      "markets",
      "bank",
      "banking",
      "finance",
      "financial",
      "bitcoin",
      "crypto",
      "earnings",
      "layoffs",
      "jobs report",
      "federal reserve",
      "mortgage",
      "housing market",
      "consumer prices",
    ],
    tagKeywords: [
      "business",
      "economy",
      "economic",
      "inflation",
      "finance",
      "financial",
      "bank",
      "banking",
      "stocks",
      "stock-market",
      "markets",
      "bitcoin",
      "crypto",
      "tariffs",
      "jobs",
      "layoffs",
    ],
  },
  crime: {
    titleKeywords: [
      "shooting",
      "shot",
      "murder",
      "killed",
      "dead",
      "arrested",
      "charged",
      "suspect",
      "police",
      "deputy",
      "deputies",
      "sheriff",
      "homicide",
      "gunfire",
      "stabbing",
      "custody",
      "officer-involved",
      "investigating",
      "warrant",
      "fugitive",
      "mass shooting",
    ],
    tagKeywords: [
      "shooting",
      "murder",
      "homicide",
      "police",
      "crime",
      "arrest",
      "arrested",
      "deputy",
      "deputies",
      "sheriff",
      "suspect",
      "gunfire",
      "stabbing",
      "robbery",
      "assault",
      "jail",
      "prison",
    ],
  },
  entertainment: {
    titleKeywords: [
      "actor",
      "actress",
      "celebrity",
      "singer",
      "rapper",
      "music",
      "album",
      "song",
      "movie",
      "film",
      "tv",
      "television",
      "netflix",
      "hollywood",
      "concert",
      "grammy",
      "oscar",
      "influencer",
      "youtube star",
      "eminem",
      "drake",
      "taylor swift",
    ],
    tagKeywords: [
      "entertainment",
      "celebrity",
      "music",
      "movie",
      "film",
      "tv",
      "television",
      "hollywood",
      "concert",
      "rapper",
      "singer",
      "actor",
      "actress",
      "eminem",
      "tiktok",
      "influencer",
      "youtube",
    ],
  },
  "local-news": {
    titleKeywords: [
      "traffic",
      "transit",
      "school board",
      "city council",
      "community",
      "local",
      "neighborhood",
      "commute",
      "road closure",
      "water outage",
      "power outage",
      "county fair",
      "public works",
    ],
    tagKeywords: [
      "atlanta",
      "georgia",
      "metro",
      "community",
      "traffic",
      "transit",
      "schools",
      "school-board",
      "neighborhood",
      "local-news",
    ],
  },
  politics: {
    titleKeywords: [
      "election",
      "ballot",
      "campaign",
      "president",
      "white house",
      "senate",
      "congress",
      "governor",
      "mayor",
      "lawmaker",
      "lawmakers",
      "legislature",
      "bill",
      "policy",
      "supreme court",
      "administration",
      "voter",
      "voting",
    ],
    tagKeywords: [
      "politics",
      "election",
      "campaign",
      "senate",
      "congress",
      "governor",
      "mayor",
      "white-house",
      "supreme-court",
      "voting",
      "ballot",
    ],
  },
  sports: {
    titleKeywords: [
      "nfl",
      "nba",
      "mlb",
      "nhl",
      "ncaa",
      "football",
      "basketball",
      "baseball",
      "soccer",
      "hockey",
      "golf",
      "tennis",
      "ufc",
      "boxing",
      "athlete",
      "coach",
      "playoffs",
      "playoff",
      "championship",
      "super bowl",
      "world series",
      "olympic",
      "tournament",
    ],
    tagKeywords: [
      "sports",
      "nfl",
      "nba",
      "mlb",
      "nhl",
      "ncaa",
      "football",
      "basketball",
      "baseball",
      "soccer",
      "hockey",
      "golf",
      "tennis",
      "ufc",
      "boxing",
      "super-bowl",
      "olympics",
    ],
  },
  technology: {
    titleKeywords: [
      "technology",
      "tech",
      "ai",
      "artificial intelligence",
      "iphone",
      "android",
      "apple",
      "google",
      "microsoft",
      "meta",
      "tesla",
      "software",
      "app",
      "cyberattack",
      "cybersecurity",
      "data breach",
      "startup",
      "semiconductor",
      "chip",
      "robot",
      "spacecraft",
      "spacex",
    ],
    tagKeywords: [
      "technology",
      "tech",
      "ai",
      "artificial-intelligence",
      "iphone",
      "android",
      "apple",
      "google",
      "microsoft",
      "meta",
      "tesla",
      "software",
      "app",
      "cybersecurity",
      "cyberattack",
      "data-breach",
      "startup",
      "semiconductor",
      "spacex",
    ],
  },
  weather: {
    titleKeywords: [
      "weather",
      "forecast",
      "storm",
      "storms",
      "tornado",
      "hurricane",
      "flood",
      "flooding",
      "rain",
      "snow",
      "blizzard",
      "hail",
      "thunderstorm",
      "lightning",
      "heat wave",
      "heat advisory",
      "wind chill",
      "severe weather",
      "radar",
    ],
    tagKeywords: [
      "weather",
      "forecast",
      "storm",
      "storms",
      "tornado",
      "hurricane",
      "flood",
      "flooding",
      "snow",
      "hail",
      "lightning",
      "severe-weather",
      "rain",
      "blizzard",
    ],
  },
  world: {
    titleKeywords: [
      "international",
      "world",
      "ukraine",
      "russia",
      "china",
      "india",
      "pakistan",
      "mexico",
      "canada",
      "israel",
      "gaza",
      "iran",
      "iraq",
      "syria",
      "vatican",
      "pope",
      "europe",
      "foreign",
    ],
    tagKeywords: [
      "world",
      "international",
      "ukraine",
      "russia",
      "china",
      "india",
      "pakistan",
      "mexico",
      "canada",
      "israel",
      "gaza",
      "iran",
      "iraq",
      "syria",
      "vatican",
      "pope",
      "europe",
    ],
  },
};

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(haystack: string, keyword: string) {
  if (!haystack || !keyword) return false;
  const pattern = new RegExp(`\\b${escapeRegex(keyword).replace(/\s+/g, "\\s+")}\\b`, "i");
  return pattern.test(haystack);
}

function scoreMatch(haystack: string, keyword: string, points: number) {
  return containsKeyword(haystack, keyword) ? points : 0;
}

function scoreCategory(rule: CategoryRule, title: string, excerpt: string, content: string, tagSlugs: Set<string>, tagNames: string[]) {
  let score = 0;

  for (const keyword of rule.tagKeywords) {
    const normalizedKeyword = normalizeText(keyword);
    const slugKeyword = slugify(keyword);
    if (tagSlugs.has(slugKeyword)) score += 6;
    if (tagNames.some((tagName) => containsKeyword(tagName, normalizedKeyword))) score += 4;
  }

  for (const keyword of rule.titleKeywords) {
    const normalizedKeyword = normalizeText(keyword);
    score += scoreMatch(title, normalizedKeyword, 4);
    score += scoreMatch(excerpt, normalizedKeyword, 2);
    score += scoreMatch(content, normalizedKeyword, 1);
  }

  return score;
}

export function inferImportedArticleCategory(input: CategoryInferenceInput): CategoryInferenceResult {
  const title = normalizeText(input.title);
  const excerpt = normalizeText(input.excerpt);
  const content = normalizeText(input.contentText).slice(0, 2_500);
  const currentCategorySlug = input.currentCategorySlug || null;
  const tagSlugs = new Set((input.tagSlugs || []).map((tag) => slugify(tag)));
  const tagNames = (input.tagNames || []).map((tag) => normalizeText(tag));

  const scores = Object.fromEntries(
    CANONICAL_CATEGORY_SLUGS.map((slug) => [
      slug,
      scoreCategory(CATEGORY_RULES[slug], title, excerpt, content, tagSlugs, tagNames),
    ]),
  ) as Record<CanonicalCategorySlug, number>;

  if (currentCategorySlug && currentCategorySlug in scores) {
    scores[currentCategorySlug as CanonicalCategorySlug] += 1;
  }

  const ranked = [...CANONICAL_CATEGORY_SLUGS]
    .map((slug) => ({
      slug,
      score: scores[slug],
    }))
    .sort((left, right) => right.score - left.score || left.slug.localeCompare(right.slug));

  const best = ranked[0] || null;
  const currentScore =
    currentCategorySlug && currentCategorySlug in scores
      ? scores[currentCategorySlug as CanonicalCategorySlug]
      : 0;

  const shouldReassign = Boolean(
    best &&
      best.slug !== currentCategorySlug &&
      SPECIALIZED_CATEGORY_SLUGS.has(best.slug) &&
      best.score >= 8 &&
      best.score >= currentScore + 3 &&
      (!currentCategorySlug || BROAD_CATEGORY_SLUGS.has(currentCategorySlug) || currentScore <= 2),
  );

  return {
    currentCategorySlug,
    suggestedCategorySlug: best?.score ? best.slug : null,
    resolvedCategorySlug: shouldReassign
      ? best?.slug || null
      : currentCategorySlug || (best && best.score >= 8 ? best.slug : null),
    scores,
    shouldReassign,
  };
}
