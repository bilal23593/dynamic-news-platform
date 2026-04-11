import type { MetadataRoute } from "next";

import { demoArticles, demoAuthors, demoCategories, demoPages } from "@/config/demo-newsroom";
import { absoluteUrl } from "@/lib/utils";
import { prisma } from "@/server/prisma";

export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "/",
    "/news",
    "/videos",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/advertise",
  ];

  try {
    const [articles, categories, authors, pages] = await Promise.all([
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, publishAt: true, updatedAt: true },
        orderBy: { publishAt: "desc" },
      }),
      prisma.category.findMany({
        where: {
          articles: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
        select: { slug: true, updatedAt: true },
      }),
      prisma.authorProfile.findMany({
        where: {
          articles: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
        select: { slug: true, updatedAt: true },
      }),
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes.map((path) => ({
        url: absoluteUrl(path),
        lastModified: new Date(),
      })),
      ...articles.map((article) => ({
        url: absoluteUrl(`/article/${article.slug}`),
        lastModified: article.updatedAt || article.publishAt,
      })),
      ...categories.map((category) => ({
        url: absoluteUrl(`/category/${category.slug}`),
        lastModified: category.updatedAt,
      })),
      ...authors.map((author) => ({
        url: absoluteUrl(`/author/${author.slug}`),
        lastModified: author.updatedAt,
      })),
      ...pages.map((page) => ({
        url: absoluteUrl(`/${page.slug}`),
        lastModified: page.updatedAt,
      })),
    ];
  } catch {
    return [
      ...staticRoutes.map((path) => ({
        url: absoluteUrl(path),
        lastModified: new Date(),
      })),
      ...demoArticles.map((article) => ({
        url: absoluteUrl(`/article/${article.slug}`),
        lastModified: article.publishAt,
      })),
      ...demoCategories.map((category) => ({
        url: absoluteUrl(`/category/${category.slug}`),
        lastModified: new Date(),
      })),
      ...demoAuthors.map((author) => ({
        url: absoluteUrl(`/author/${author.slug}`),
        lastModified: new Date(),
      })),
      ...demoPages
        .filter((page) => !staticRoutes.includes(`/${page.slug}`))
        .map((page) => ({
          url: absoluteUrl(`/${page.slug}`),
          lastModified: new Date(),
        })),
    ];
  }
}
