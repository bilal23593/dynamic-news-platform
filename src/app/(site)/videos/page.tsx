import type { Metadata } from "next";

import { SectionHeading } from "@/components/shared/section-heading";
import { StoryCard } from "@/components/shared/story-card";
import { buildKeywords, buildSeoMetadata } from "@/lib/seo";
import { getVideoHighlights } from "@/server/cms/public";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

export const metadata: Metadata = buildSeoMetadata({
  title: "Video Highlights",
  description: "Forecasts, explainers, and newsroom video coverage from Redwire Daily.",
  path: "/videos",
  keywords: buildKeywords(siteConfig.defaultKeywords, ["video highlights", "news video", "live coverage"]),
});

export default async function VideosPage() {
  const videos = await getVideoHighlights();

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <SectionHeading title="Video Highlights" eyebrow="Watch" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((article) => (
          <StoryCard key={article.slug} article={article} />
        ))}
      </div>
    </main>
  );
}
