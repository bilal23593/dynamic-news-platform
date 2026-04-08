import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/utils";
import { getLatestArticles, getNavigationCategories } from "@/server/cms/public";

export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([getLatestArticles(48), getNavigationCategories()]);

  const staticRoutes = [
    "/",
    "/news",
    "/videos",
    "/search",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/advertise",
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/article/${article.slug}`),
      lastModified: new Date(article.publishAt),
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: new Date(),
    })),
  ];
}
