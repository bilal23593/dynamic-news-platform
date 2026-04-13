import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoryCard } from "@/components/shared/story-card";
import { buildKeywords, buildSeoMetadata } from "@/lib/seo";
import { getSubCategoryPageData } from "@/server/cms/public";
import { getStaticSubCategoryParams } from "@/server/cms/static-params";

export const dynamic = "force-static";
export const revalidate = 600;

type Props = {
  params: Promise<{ slug: string; subSlug: string }>;
};

export async function generateStaticParams() {
  return getStaticSubCategoryParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subSlug } = await params;
  const data = await getSubCategoryPageData(slug, subSlug);
  if (!data?.activeSubCategory) return {};

  return buildSeoMetadata({
    title: `${data.activeSubCategory.name} | ${data.category.name}`,
    description: `Coverage from ${data.activeSubCategory.name} within ${data.category.name}.`,
    path: `/category/${data.category.slug}/${data.activeSubCategory.slug}`,
    section: data.category.name,
    keywords: buildKeywords(
      data.category.name,
      data.category.label,
      data.activeSubCategory.name,
      ["subsection news", "news archive"],
    ),
  });
}

export default async function SubCategoryPage({ params }: Props) {
  const { slug, subSlug } = await params;
  const data = await getSubCategoryPageData(slug, subSlug);
  if (!data?.activeSubCategory) notFound();

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <div className="space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Subsection</div>
        <h1 className="font-serif text-4xl font-black tracking-tight">{data.activeSubCategory.name}</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.articles.map((article) => (
          <StoryCard key={article.slug} article={article} />
        ))}
      </div>
    </main>
  );
}
