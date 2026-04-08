import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/shared/section-heading";
import { StoryCard } from "@/components/shared/story-card";
import { getAuthorPageData } from "@/server/cms/public";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAuthorPageData(slug);
  if (!data) return {};

  return {
    title: data.author.displayName,
    description: data.author.bio || `Stories written by ${data.author.displayName}.`,
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const data = await getAuthorPageData(slug);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 rounded-[var(--radius)] border border-border/70 bg-white p-6 lg:grid-cols-[220px_1fr]">
        {data.author.avatarUrl ? (
          <div className="relative aspect-square overflow-hidden rounded-[var(--radius)]">
            <Image src={data.author.avatarUrl} alt={data.author.displayName} fill className="object-cover" />
          </div>
        ) : null}
        <div className="space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Author</div>
          <h1 className="font-serif text-4xl font-black tracking-tight">{data.author.displayName}</h1>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{data.author.title}</p>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{data.author.bio}</p>
        </div>
      </section>
      <SectionHeading title="Latest Stories" eyebrow="Byline archive" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.articles.map((article) => (
          <StoryCard key={article.slug} article={article} />
        ))}
      </div>
    </main>
  );
}
