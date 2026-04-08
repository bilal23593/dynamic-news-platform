import type { Metadata } from "next";
import Image from "next/image";
import { after } from "next/server";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/forms/comment-form";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { AdSlotBlock } from "@/components/shared/ad-slot-block";
import { BreadcrumbTrail } from "@/components/shared/breadcrumb-trail";
import { SectionHeading } from "@/components/shared/section-heading";
import { ShareButtons } from "@/components/shared/share-buttons";
import { StoryCard } from "@/components/shared/story-card";
import { Badge } from "@/components/ui/badge";
import { injectAdSlotsIntoHtml } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { getAdSlotsByPlacement, getArticleBySlug } from "@/server/cms/public";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt,
    alternates: {
      canonical: article.canonicalUrl || `/article/${article.slug}`,
    },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.metaDescription || article.excerpt,
      type: "article",
      images: article.featuredImageUrl ? [{ url: article.featuredImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || article.title,
      description: article.metaDescription || article.excerpt,
      images: article.featuredImageUrl ? [article.featuredImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, inlineAds, sidebarAds] = await Promise.all([
    getArticleBySlug(slug),
    getAdSlotsByPlacement("IN_ARTICLE"),
    getAdSlotsByPlacement("SIDEBAR"),
  ]);
  if (!article) notFound();

  if (article.id) {
    after(() =>
      prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      }),
    );
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImageUrl ? [article.featuredImageUrl] : undefined,
    datePublished: new Date(article.publishAt).toISOString(),
    author: {
      "@type": "Person",
      name: article.author.displayName,
    },
  };

  const enrichedArticleHtml = injectAdSlotsIntoHtml(article.contentHtml, inlineAds);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <BreadcrumbTrail
        items={[
          { label: "Home", href: "/" },
          { label: article.category.name, href: `/category/${article.category.slug}` },
          ...(article.subCategory
            ? [
                {
                  label: article.subCategory.name,
                  href: `/category/${article.category.slug}/${article.subCategory.slug}`,
                },
              ]
            : []),
          { label: article.title },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="space-y-8">
          <header className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge>{article.category.label || article.category.name}</Badge>
              {article.breakingNews ? <Badge variant="destructive">Breaking</Badge> : null}
              {article.trending ? <Badge variant="dark">Trending</Badge> : null}
            </div>
            <h1 className="font-serif text-4xl font-black tracking-tight lg:text-6xl">{article.title}</h1>
            {article.subtitle ? <p className="text-xl leading-8 text-muted-foreground">{article.subtitle}</p> : null}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span>{article.author.displayName}</span>
              <span>{formatDate(article.publishAt)}</span>
              <span>{article.readTime} min read</span>
            </div>
            <ShareButtons path={`/article/${article.slug}`} title={article.title} />
          </header>

          {article.featuredImageUrl ? (
            <figure className="space-y-3">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius)]">
                <Image
                  src={article.featuredImageUrl}
                  alt={article.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1280px) 860px, (min-width: 1024px) calc(100vw - 420px), 100vw"
                />
              </div>
              {article.imageCaption ? <figcaption className="text-sm text-muted-foreground">{article.imageCaption}</figcaption> : null}
            </figure>
          ) : null}

          <div className="editorial-surface rounded-[var(--radius)] p-6 lg:p-8">
            <div
              className="story-copy"
              dangerouslySetInnerHTML={{ __html: enrichedArticleHtml }}
            />
          </div>

          <section className="space-y-4 rounded-[var(--radius)] border border-border/70 bg-white p-6">
            <SectionHeading title="Comments" eyebrow="Community" />
            {article.comments.length ? (
              <div className="space-y-4">
                {article.comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {comment.authorName}
                    </div>
                    <p className="text-sm leading-7 text-foreground">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No approved comments yet.</p>
            )}
            {article.allowComments ? <CommentForm articleSlug={article.slug} /> : null}
          </section>
        </article>

        <aside className="space-y-6">
          {sidebarAds.map((slot) => (
            <AdSlotBlock key={slot.key} slot={slot} title={slot.sponsorLabel || "Sponsored"} />
          ))}
          <section className="rounded-[var(--radius)] border border-border/70 bg-white p-6">
            <SectionHeading title="Newsletter" eyebrow="Briefing" />
            <p className="mb-4 text-sm leading-7 text-muted-foreground">
              Get the morning rundown with top stories, weather, and what to watch before your day starts.
            </p>
            <NewsletterForm />
          </section>
          <section className="space-y-4">
            <SectionHeading title="Related Stories" eyebrow="Keep reading" />
            <div className="space-y-4">
              {article.related.map((related) => (
                <StoryCard key={related.slug} article={related} variant="compact" />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
