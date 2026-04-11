import { Prisma } from "@prisma/client";

import { prisma } from "../src/server/prisma";

type HomepageRetune = {
  title?: string;
  enabled?: boolean;
  sourceType?: "MANUAL" | "LATEST" | "TRENDING" | "MOST_READ" | "BREAKING" | "FEATURED" | "CATEGORY" | "TAG" | "VIDEO";
  categorySlug?: string | null;
  tagSlug?: string | null;
  settings?: Record<string, unknown>;
};

const HOMEPAGE_RETUNE: Record<string, HomepageRetune> = {
  "home-live-now": {
    enabled: false,
  },
  "home-weather-center": {
    title: "Weather Center",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "weather",
    settings: {
      eyebrow: "Forecast",
      layout: "weather",
      viewAllHref: "/category/weather",
      viewAllLabel: "Weather desk",
    },
  },
  "home-hero": {
    title: "Top Stories",
    enabled: true,
    sourceType: "FEATURED",
    settings: {
      eyebrow: "Top Stories",
      layout: "split",
    },
  },
  "home-breaking": {
    title: "Breaking",
    enabled: true,
    sourceType: "BREAKING",
  },
  "home-latest-videos": {
    title: "Latest Videos",
    enabled: true,
    sourceType: "VIDEO",
    settings: {
      eyebrow: "Video",
      layout: "compact",
      viewAllHref: "/videos",
      viewAllLabel: "Watch more",
    },
  },
  "home-newsletter": {
    enabled: true,
  },
  "home-local-news": {
    title: "Local News",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "local-news",
    settings: {
      eyebrow: "Local News",
      layout: "dense",
      viewAllHref: "/category/local-news",
      viewAllLabel: "Local desk",
    },
  },
  "home-us-world": {
    title: "U.S. & World",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "world",
    settings: {
      eyebrow: "World Desk",
      layout: "dense",
      viewAllHref: "/category/world",
      viewAllLabel: "World coverage",
    },
  },
  "home-consumer": {
    title: "Business & Economy",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "business-economy",
    settings: {
      eyebrow: "Business",
      layout: "dense",
      promoText: "Markets, companies, consumer impact, and money stories with direct practical relevance.",
      viewAllHref: "/category/business-economy",
      viewAllLabel: "Business desk",
    },
  },
  "home-good-day": {
    title: "Georgia Watch",
    enabled: true,
    sourceType: "TAG",
    tagSlug: "georgia",
    settings: {
      eyebrow: "Georgia",
      layout: "dense",
      promoText: "Georgia headlines, regional public safety, and local stories moving fast enough to matter nationally.",
      viewAllHref: "/tag/georgia",
      viewAllLabel: "Georgia coverage",
    },
  },
  "home-seen-on-tv": {
    enabled: false,
  },
  "home-things-to-do": {
    title: "Technology",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "technology",
    settings: {
      eyebrow: "Technology",
      layout: "compact",
      promoText: "Platform shifts, AI updates, launches, and technology stories worth tracking closely.",
      viewAllHref: "/category/technology",
      viewAllLabel: "Tech desk",
    },
  },
  "home-sports": {
    title: "Sports",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "sports",
    settings: {
      eyebrow: "Sports",
      layout: "dense",
      viewAllHref: "/category/sports",
      viewAllLabel: "Sports desk",
    },
  },
  "home-money": {
    title: "Texas Watch",
    enabled: true,
    sourceType: "TAG",
    tagSlug: "texas",
    settings: {
      eyebrow: "Texas",
      layout: "dense",
      promoText: "Texas crime, public safety, and fast-moving statewide stories with outsized audience interest.",
      viewAllHref: "/tag/texas",
      viewAllLabel: "Texas coverage",
    },
  },
  "home-politics": {
    title: "Politics",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "politics",
    settings: {
      eyebrow: "Politics",
      layout: "dense",
      viewAllHref: "/category/politics",
      viewAllLabel: "Politics desk",
    },
  },
  "home-health": {
    enabled: false,
  },
  "home-entertainment": {
    title: "Entertainment",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "entertainment",
    settings: {
      eyebrow: "Entertainment",
      layout: "compact",
      viewAllHref: "/category/entertainment",
      viewAllLabel: "More entertainment",
    },
  },
  "home-video": {
    enabled: false,
  },
  "home-unusual": {
    enabled: false,
  },
  "home-investigations": {
    title: "Crime Watch",
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "crime",
    settings: {
      eyebrow: "Crime",
      layout: "dense",
      promoText: "Accountability, arrests, public safety, and the crime stories drawing the most repeat readership.",
      viewAllHref: "/category/crime",
      viewAllLabel: "Crime desk",
    },
  },
  "home-sponsored": {
    enabled: true,
  },
  "home-most-read": {
    enabled: true,
    sourceType: "MOST_READ",
    settings: {
      eyebrow: "Most Read",
      layout: "dense",
    },
  },
};

function normalizeTagKey(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

async function mergeDuplicateTags() {
  const tags = await prisma.tag.findMany({
    include: {
      articleTags: {
        select: {
          articleId: true,
        },
      },
      homepageSections: {
        select: {
          id: true,
        },
      },
    },
  });

  const groups = new Map<string, typeof tags>();
  for (const tag of tags) {
    const key = normalizeTagKey(tag.name);
    const list = groups.get(key) || [];
    list.push(tag);
    groups.set(key, list);
  }

  let mergedGroups = 0;
  let mergedTags = 0;

  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    const ranked = [...group].sort((left, right) => {
      return (
        right.articleTags.length - left.articleTags.length ||
        left.name.length - right.name.length ||
        left.name.localeCompare(right.name)
      );
    });

    const primary = ranked[0]!;
    const duplicates = ranked.slice(1);
    if (!duplicates.length) continue;

    for (const duplicate of duplicates) {
      const articleIds = duplicate.articleTags.map((item) => item.articleId);
      if (articleIds.length) {
        await prisma.articleTag.createMany({
          data: articleIds.map((articleId) => ({
            articleId,
            tagId: primary.id,
          })),
          skipDuplicates: true,
        });
      }

      await prisma.homepageSection.updateMany({
        where: { tagId: duplicate.id },
        data: { tagId: primary.id },
      });

      await prisma.legacyContentMap.updateMany({
        where: { newTagId: duplicate.id },
        data: { newTagId: primary.id },
      });

      await prisma.tag.delete({
        where: { id: duplicate.id },
      });

      mergedTags += 1;
    }

    mergedGroups += 1;
  }

  return { mergedGroups, mergedTags };
}

async function deleteLowQualityTags() {
  const sectionTagIds = new Set(
    (
      await prisma.homepageSection.findMany({
        where: { tagId: { not: null } },
        select: { tagId: true },
      })
    )
      .map((item) => item.tagId)
      .filter(Boolean),
  );

  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      _count: {
        select: {
          articleTags: true,
        },
      },
    },
  });

  const deleteIds = tags
    .filter((tag) => tag._count.articleTags <= 1 && !sectionTagIds.has(tag.id))
    .map((tag) => tag.id);

  for (let index = 0; index < deleteIds.length; index += 250) {
    const slice = deleteIds.slice(index, index + 250);
    await prisma.tag.deleteMany({
      where: {
        id: {
          in: slice,
        },
      },
    });
  }

  return { deletedTags: deleteIds.length };
}

async function retuneHomepageSections() {
  const [categories, tags, sections] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.tag.findMany({ select: { id: true, slug: true } }),
    prisma.homepageSection.findMany({ select: { id: true, key: true, settings: true } }),
  ]);

  const categoryMap = new Map(categories.map((category) => [category.slug, category.id]));
  const tagMap = new Map(tags.map((tag) => [tag.slug, tag.id]));
  let updated = 0;

  for (const section of sections) {
    const config = HOMEPAGE_RETUNE[section.key];
    if (!config) continue;

    const nextCategoryId =
      config.sourceType === "CATEGORY"
        ? config.categorySlug
          ? categoryMap.get(config.categorySlug) || null
          : null
        : null;
    const nextTagId =
      config.sourceType === "TAG"
        ? config.tagSlug
          ? tagMap.get(config.tagSlug) || null
          : null
        : null;
    const enabled =
      config.enabled !== undefined
        ? config.enabled &&
          (config.sourceType !== "CATEGORY" || Boolean(nextCategoryId)) &&
          (config.sourceType !== "TAG" || Boolean(nextTagId))
        : undefined;

    const existingSettings =
      section.settings && typeof section.settings === "object" && !Array.isArray(section.settings)
        ? (section.settings as Record<string, unknown>)
        : {};

    await prisma.homepageSection.update({
      where: { id: section.id },
      data: {
        title: config.title,
        enabled,
        sourceType: config.sourceType,
        categoryId: nextCategoryId,
        tagId: nextTagId,
        settings: config.settings ? ({ ...existingSettings, ...config.settings } as Prisma.InputJsonValue) : undefined,
      },
    });

    updated += 1;
  }

  return { updatedSections: updated };
}

async function main() {
  console.log("Curating imported taxonomy and homepage...");
  const merged = await mergeDuplicateTags();
  const deleted = await deleteLowQualityTags();
  const homepage = await retuneHomepageSections();

  const remaining = await prisma.tag.count();

  console.log(
    JSON.stringify(
      {
        ...merged,
        ...deleted,
        ...homepage,
        remainingTags: remaining,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
