import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/shared/section-heading";
import { StoryCard } from "@/components/shared/story-card";
import { getTagPageData } from "@/server/cms/public";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTagPageData(slug);
  if (!data) return {};
  return {
    title: `Tag: ${data.tag.name}`,
    description: `Stories tagged ${data.tag.name}.`,
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const data = await getTagPageData(slug);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <SectionHeading title={`Tag: ${data.tag.name}`} eyebrow="Topic" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.articles.map((article) => (
          <StoryCard key={article.slug} article={article} />
        ))}
      </div>
    </main>
  );
}
