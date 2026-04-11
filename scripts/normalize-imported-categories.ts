import { prisma } from "../src/server/prisma";
import { inferImportedArticleCategory } from "../src/lib/wordpress-import/services/category-inference";

const SAFE_LIVE_REASSIGNMENTS = new Set(["politics", "weather"]);

async function main() {
  console.log("Normalizing imported article categories...");

  const [categories, articles] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        slug: true,
      },
    }),
    prisma.article.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        contentText: true,
        category: {
          select: {
            slug: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const categoryMap = new Map(categories.map((category) => [category.slug, category.id]));
  const updates: Array<{
    articleId: string;
    slug: string;
    title: string;
    from: string;
    to: string;
  }> = [];

  for (const article of articles) {
    const inference = inferImportedArticleCategory({
      title: article.title,
      excerpt: article.excerpt,
      contentText: article.contentText,
      currentCategorySlug: article.category.slug,
      tagSlugs: article.tags.map((item) => item.tag.slug),
      tagNames: article.tags.map((item) => item.tag.name),
    });

    if (!inference.shouldReassign || !inference.resolvedCategorySlug) {
      continue;
    }

    if (!SAFE_LIVE_REASSIGNMENTS.has(inference.resolvedCategorySlug)) {
      continue;
    }

    const nextCategoryId = categoryMap.get(inference.resolvedCategorySlug);
    if (!nextCategoryId || inference.resolvedCategorySlug === article.category.slug) {
      continue;
    }

    updates.push({
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      from: article.category.slug,
      to: inference.resolvedCategorySlug,
    });
  }

  for (const update of updates) {
    await prisma.article.update({
      where: { id: update.articleId },
      data: { categoryId: categoryMap.get(update.to)! },
    });
  }

  const breakdown = updates.reduce<Record<string, number>>((accumulator, update) => {
    const key = `${update.from}->${update.to}`;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  console.log(
    JSON.stringify(
      {
        updatedArticles: updates.length,
        breakdown,
        sample: updates.slice(0, 15),
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
