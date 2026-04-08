import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { PublicArticleSummary } from "@/types/cms";
import { cn, compactNumber, formatDate } from "@/lib/utils";

export function StoryCard({
  article,
  variant = "default",
  priority = false,
}: {
  article: PublicArticleSummary;
  variant?: "lead" | "default" | "compact";
  priority?: boolean;
}) {
  const isLead = variant === "lead";
  const isCompact = variant === "compact";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[var(--radius)] border border-border/70 bg-white shadow-[0_12px_32px_rgba(17,17,17,0.06)] transition-transform hover:-translate-y-1",
        isCompact ? "flex gap-4 p-4" : "flex h-full flex-col",
      )}
    >
      {article.featuredImageUrl ? (
        <Link
          href={`/article/${article.slug}`}
          prefetch={false}
          className={cn("relative block overflow-hidden", isCompact ? "h-24 w-28 shrink-0 rounded-xl" : "aspect-[16/10]")}
        >
          <Image
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt || article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
            sizes={
              isCompact
                ? "112px"
                : isLead
                  ? "(min-width: 1280px) 760px, (min-width: 1024px) 58vw, 100vw"
                  : "(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
            }
          />
        </Link>
      ) : null}

      <div className={cn("flex flex-1 flex-col", isCompact ? "min-w-0" : "p-5")}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={article.breakingNews ? "destructive" : "default"}>
            {article.category.label || article.category.name}
          </Badge>
          {article.trending ? <Badge variant="dark">Trending</Badge> : null}
          {article.popular ? <Badge variant="secondary">Most read</Badge> : null}
        </div>

        <Link href={`/article/${article.slug}`} prefetch={false} className="space-y-3">
          <h3
            className={cn(
              "font-serif font-black tracking-tight text-foreground group-hover:text-primary",
              isLead ? "text-4xl leading-tight" : isCompact ? "line-clamp-3 text-lg leading-snug" : "text-2xl leading-snug",
            )}
          >
            {article.title}
          </h3>
          {!isCompact ? (
            <p className={cn("text-muted-foreground", isLead ? "text-base leading-7" : "line-clamp-3 text-sm leading-6")}>
              {article.excerpt}
            </p>
          ) : null}
        </Link>

        <div className={cn("mt-auto flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground", isCompact ? "pt-3" : "pt-5")}>
          <span>{article.author.displayName}</span>
          <span>{formatDate(article.publishAt)}</span>
          <span>{article.readTime} min read</span>
          <span>{compactNumber(article.viewCount)} views</span>
        </div>
      </div>
    </article>
  );
}
