import type { Metadata } from "next";

import { SectionHeading } from "@/components/shared/section-heading";
import { StoryCard } from "@/components/shared/story-card";
import { getLatestArticles } from "@/server/cms/public";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Latest News",
  description: `The latest reporting from ${siteConfig.name} across politics, metro, investigations, business, sports, and weather.`,
};

export default async function NewsPage() {
  const articles = await getLatestArticles(24);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <SectionHeading title="Latest News" eyebrow="News Feed" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <StoryCard key={article.slug} article={article} />
        ))}
      </div>
    </main>
  );
}
