import "server-only";

import { demoAuthors, demoCategories, demoPages } from "@/config/demo-newsroom";
import { prisma } from "@/server/prisma";

async function withStaticParamsFallback<T>(query: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback();
  }
}

export async function getStaticCategoryParams() {
  return withStaticParamsFallback(
    async () => {
      const categories = await prisma.category.findMany({
        where: {
          articles: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
        select: {
          slug: true,
        },
        orderBy: [
          { sortOrder: "asc" },
          { updatedAt: "desc" },
        ],
      });

      return categories.map((category) => ({
        slug: category.slug,
      }));
    },
    () =>
      demoCategories.map((category) => ({
        slug: category.slug,
      })),
  );
}

export async function getStaticSubCategoryParams() {
  return withStaticParamsFallback(
    async () => {
      const subcategories = await prisma.subCategory.findMany({
        where: {
          articles: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
        select: {
          slug: true,
          category: {
            select: {
              slug: true,
            },
          },
        },
        orderBy: [
          { category: { sortOrder: "asc" } },
          { sortOrder: "asc" },
          { updatedAt: "desc" },
        ],
      });

      return subcategories.map((subcategory) => ({
        slug: subcategory.category.slug,
        subSlug: subcategory.slug,
      }));
    },
    () =>
      demoCategories.flatMap((category) =>
        category.subcategories.map((subcategory) => ({
          slug: category.slug,
          subSlug: subcategory.slug,
        })),
      ),
  );
}

export async function getStaticAuthorParams() {
  return withStaticParamsFallback(
    async () => {
      const authors = await prisma.authorProfile.findMany({
        where: {
          articles: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
        select: {
          slug: true,
        },
        orderBy: [
          { updatedAt: "desc" },
          { displayName: "asc" },
        ],
      });

      return authors.map((author) => ({
        slug: author.slug,
      }));
    },
    () =>
      demoAuthors.map((author) => ({
        slug: author.slug,
      })),
  );
}

export async function getStaticPageParams() {
  return withStaticParamsFallback(
    async () => {
      const pages = await prisma.page.findMany({
        where: {
          status: "PUBLISHED",
        },
        select: {
          slug: true,
        },
        orderBy: [
          { updatedAt: "desc" },
          { slug: "asc" },
        ],
      });

      return pages.map((page) => ({
        slug: [page.slug],
      }));
    },
    () =>
      demoPages.map((page) => ({
        slug: [page.slug],
      })),
  );
}
