import type { Metadata } from "next";

import { HomepageSection, shouldRenderHomepageSection } from "@/features/homepage/components/homepage-section";
import { buildKeywords, buildSeoMetadata } from "@/lib/seo";
import { getHomepageData } from "@/server/cms/public";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

export const metadata: Metadata = buildSeoMetadata({
  title: siteConfig.name,
  description: `Breaking stories, live updates, video highlights, and curated local-to-national reporting from ${siteConfig.name}.`,
  path: "/",
  keywords: buildKeywords(siteConfig.defaultKeywords, ["top stories", "latest headlines", siteConfig.shortName]),
});

export default async function HomePage() {
  const data = await getHomepageData();
  const visibleSections = data.sections.filter(shouldRenderHomepageSection);

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-6">
      {visibleSections.map((section, index) => (
        <HomepageSection key={section.key} section={section} index={index} />
      ))}
    </main>
  );
}
