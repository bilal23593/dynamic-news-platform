import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { after } from "next/server";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/forms/comment-form";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { AdSlotBlock } from "@/components/shared/ad-slot-block";
import { SectionHeading } from "@/components/shared/section-heading";
import { ShareButtons } from "@/components/shared/share-buttons";
import { StoryCard } from "@/components/shared/story-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { injectAdSlotsIntoHtml } from "@/lib/content";
import { buildKeywords, buildSeoMetadata, resolveCanonicalUrl } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { getAdSlotsByPlacement, getArticleBySlug, getArticleShellBySlug } from "@/server/cms/public";
import { queueArticleView } from "@/server/cms/view-tracker";

export const dynamic = "force-static";
export const revalidate = 600;

type Props = {
  params: Promise<{ slug: string }>;
};

type ArticleDetailResult = Awaited<ReturnType<typeof getArticleBySlug>>;
type AdSlotsResult = Awaited<ReturnType<typeof getAdSlotsByPlacement>>;

function ArticleSidebarFallback() {
  return (
    <aside className="space-y-5 sm:space-y-6 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-[var(--radius)] border border-border/70 bg-white p-4 sm:p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-20 w-full" />
        <Skeleton className="mt-3 h-11 w-full" />
        <Skeleton className="mt-3 h-11 w-full" />
      </section>
      <section className="rounded-[var(--radius)] border border-border/70 bg-white p-4 sm:p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-4 h-11 w-full" />
        <Skeleton className="mt-3 h-11 w-full" />
        <Skeleton className="mt-3 h-11 w-full" />
      </section>
    </aside>
  );
}

function ArticleCommentsFallback({ allowComments }: { allowComments: boolean }) {
  return (
    <section className="space-y-4 rounded-[var(--radius)] border border-border/70 bg-white p-4 sm:p-6">
      <SectionHeading title="Comments" eyebrow="Community" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      {allowComments ? (
        <>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-11 w-40" />
        </>
      ) : null}
    </section>
  );
}

async function ArticleSidebar({
  articlePromise,
  sidebarAdsPromise,
}: {
  articlePromise: Promise<ArticleDetailResult>;
  sidebarAdsPromise: Promise<AdSlotsResult>;
}) {
  const [article, sidebarAds] = await Promise.all([articlePromise, sidebarAdsPromise]);
  if (!article) return null;

  return (
    <aside className="space-y-5 sm:space-y-6 xl:sticky xl:top-24 xl:self-start">
      {sidebarAds.map((slot) => (
        <AdSlotBlock key={slot.key} slot={slot} title={slot.sponsorLabel || "Sponsored"} />
      ))}
      <section className="rounded-[var(--radius)] border border-border/70 bg-white p-4 sm:p-6">
        <SectionHeading title="Newsletter" eyebrow="Briefing" />
        <p className="mb-4 text-sm leading-7 text-muted-foreground">
          Get the morning rundown with top stories, weather, and what to watch before your day starts.
        </p>
        <NewsletterForm />
      </section>
      {article.related.length ? (
        <section className="space-y-4">
          <SectionHeading title="Related Stories" eyebrow="Keep reading" />
          <div className="space-y-4">
            {article.related.map((related) => (
              <StoryCard key={related.slug} article={related} variant="compact" />
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}

async function ArticleCommentsSection({ articlePromise }: { articlePromise: Promise<ArticleDetailResult> }) {
  const article = await articlePromise;
  if (!article) return null;

  return (
    <section id="comments" className="space-y-4 rounded-[var(--radius)] border border-border/70 bg-white p-4 sm:p-6">
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
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleShellBySlug(slug);
  if (!article) return {};

  return buildSeoMetadata({
    title: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt,
    path: `/article/${article.slug}`,
    canonicalUrl: article.canonicalUrl,
    imageUrl: article.featuredImageUrl,
    imageAlt: article.featuredImageAlt || article.title,
    type: "article",
    section: article.category.label || article.category.name,
    authorNames: [article.author.displayName],
    publishedTime: new Date(article.publishAt).toISOString(),
    modifiedTime: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
    keywords: buildKeywords(
      siteConfig.defaultKeywords,
      article.category.name,
      article.category.label,
      article.subCategory?.name,
      article.tags.map((tag) => tag.name),
      article.breakingNews ? "breaking news" : undefined,
      article.trending ? "trending news" : undefined,
    ),
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, inlineAds] = await Promise.all([
    getArticleShellBySlug(slug),
    getAdSlotsByPlacement("IN_ARTICLE"),
  ]);
  if (!article) notFound();

  const articleDetailPromise = getArticleBySlug(slug);
  const sidebarAdsPromise = getAdSlotsByPlacement("SIDEBAR");

  if (article.id) {
    after(() => {
      queueArticleView(article.id!);
    });
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": article.schemaType || "NewsArticle",
    headline: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt,
    mainEntityOfPage: resolveCanonicalUrl(article.canonicalUrl, `/article/${article.slug}`),
    image: article.featuredImageUrl ? [resolveCanonicalUrl(article.featuredImageUrl, `/article/${article.slug}`)] : undefined,
    datePublished: new Date(article.publishAt).toISOString(),
    dateModified: new Date(article.updatedAt || article.publishAt).toISOString(),
    articleSection: article.category.label || article.category.name,
    keywords: buildKeywords(
      article.category.name,
      article.subCategory?.name,
      article.tags.map((tag) => tag.name),
    ).join(", "),
    author: {
      "@type": "Person",
      name: article.author.displayName,
      url: resolveCanonicalUrl(null, `/author/${article.author.slug}`),
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: resolveCanonicalUrl(null, siteConfig.logoPath),
      },
    },
  };

  const enrichedArticleHtml = injectAdSlotsIntoHtml(article.contentHtml, inlineAds);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-4 lg:space-y-6 lg:px-6 lg:py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
        <article className="space-y-5 sm:space-y-6">
          <header className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{article.category.label || article.category.name}</Badge>
              {article.breakingNews ? <Badge variant="destructive">Breaking</Badge> : null}
              {article.trending ? <Badge variant="dark">Trending</Badge> : null}
            </div>
            <h1 className="max-w-[22ch] text-balance font-serif text-[2.85rem] font-black tracking-tight leading-[0.95] sm:text-5xl xl:text-[4.6rem] xl:leading-[0.95]">
              {article.title}
            </h1>
            {article.subtitle ? (
              <p className="max-w-[42rem] text-lg leading-8 text-muted-foreground sm:text-[1.3rem] sm:leading-8">
                {article.subtitle}
              </p>
            ) : null}
            <div className="inline-flex max-w-full flex-wrap items-center gap-2.5 rounded-[var(--radius)] border border-border/70 bg-white/85 px-4 py-2.5 sm:gap-3">
              {article.author.avatarUrl ? (
                <Image
                  src={article.author.avatarUrl}
                  alt={article.author.displayName}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">{article.author.displayName}</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{formatDate(article.publishAt)}</span>
                    <span>{article.readTime} min read</span>
                  </div>
                </div>
              </div>
            </div>
            <ShareButtons path={`/article/${article.slug}`} title={article.title} />
          </header>

          {article.featuredImageUrl ? (
            <figure className="space-y-2">
              <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius)]">
                <Image
                  src={article.featuredImageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="(min-width: 1280px) 860px, (min-width: 1024px) calc(100vw - 420px), 100vw"
                />
              </div>
              {article.imageCaption ? <figcaption className="text-sm text-muted-foreground">{article.imageCaption}</figcaption> : null}
            </figure>
          ) : null}

          <div className="editorial-surface rounded-[var(--radius)] border border-border/60 p-4 sm:p-6 lg:p-8">
            <div
              className="story-copy"
              dangerouslySetInnerHTML={{ __html: enrichedArticleHtml }}
            />
          </div>

          <Suspense fallback={<ArticleCommentsFallback allowComments={article.allowComments} />}>
            <ArticleCommentsSection articlePromise={articleDetailPromise} />
          </Suspense>
        </article>

        <Suspense fallback={<ArticleSidebarFallback />}>
          <ArticleSidebar articlePromise={articleDetailPromise} sidebarAdsPromise={sidebarAdsPromise} />
        </Suspense>
      </div>
    </main>
  );
}
