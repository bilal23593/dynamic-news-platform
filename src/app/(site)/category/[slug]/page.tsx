import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/shared/section-heading";
import { StoryCard } from "@/components/shared/story-card";
import { buildKeywords, buildSeoMetadata } from "@/lib/seo";
import { getCategoryPageData } from "@/server/cms/public";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) return {};

  return buildSeoMetadata({
    title: data.category.name,
    description: data.description || `Coverage from the ${data.category.name} desk.`,
    path: `/category/${data.category.slug}`,
    section: data.category.name,
    keywords: buildKeywords(
      data.category.name,
      data.category.label,
      data.subcategories.map((item) => item.name),
      ["section news", "local reporting"],
    ),
  });
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <SectionHeading title={data.category.name} eyebrow="Section" />
      <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{data.description}</p>
      <div className="flex flex-wrap gap-2">
        {data.subcategories.map((subcategory) => (
          <Link
            key={subcategory.slug}
            href={`/category/${data.category.slug}/${subcategory.slug}`}
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] hover:border-primary hover:text-primary"
          >
            {subcategory.name}
          </Link>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.articles.map((article) => (
          <StoryCard key={article.slug} article={article} />
        ))}
      </div>
    </main>
  );
}
