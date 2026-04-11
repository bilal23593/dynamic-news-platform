import { categoryNavigationDefaults, resolveCategoryNavigationMeta } from "../src/lib/category-navigation";
import { prisma } from "../src/server/prisma";

async function main() {
  console.log("Normalizing category navigation metadata...");

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      label: true,
      sortOrder: true,
    },
  });

  const updates = categories
    .map((category) => {
      const next = resolveCategoryNavigationMeta(category);
      const defaults = categoryNavigationDefaults[category.slug];

      if (!defaults) {
        return null;
      }

      if (category.label === next.label && category.sortOrder === next.sortOrder) {
        return null;
      }

      return {
        id: category.id,
        slug: category.slug,
        before: {
          label: category.label,
          sortOrder: category.sortOrder,
        },
        after: {
          label: next.label,
          sortOrder: next.sortOrder,
        },
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    slug: string;
    before: { label: string | null; sortOrder: number };
    after: { label: string; sortOrder: number };
  }>;

  for (const update of updates) {
    await prisma.category.update({
      where: { id: update.id },
      data: {
        label: update.after.label,
        sortOrder: update.after.sortOrder,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        updatedCategories: updates.length,
        updates,
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
