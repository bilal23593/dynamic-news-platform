import Link from "next/link";

import { AdSlotBlock } from "@/components/shared/ad-slot-block";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import type { PublicAdSlot } from "@/types/cms";

export function PublicHeader({
  categories,
  headerAd,
}: {
  categories: Array<{ name: string; slug: string; label?: string | null }>;
  headerAd?: PublicAdSlot | null;
}) {
  const primaryCategories = categories.slice(0, 6);
  const overflowCategories = categories.slice(6);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:gap-4 lg:px-6 lg:py-4">
        {headerAd ? <AdSlotBlock slot={headerAd} title={headerAd.sponsorLabel || "Sponsored"} /> : null}
        <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
          <Logo />
          <Button asChild size="sm" className="h-10 px-4 lg:hidden">
            <Link href="/advertise">Advertise</Link>
          </Button>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="rounded-full border border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Fast reporting. Clean signal.
            </div>
            <Button asChild size="sm">
              <Link href="/advertise">Advertise</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="min-w-0 rounded-full border border-border/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Fast reporting. Clean signal.
          </div>
        </div>
        <nav className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/news"
            className="flex h-11 shrink-0 snap-start items-center rounded-full bg-secondary px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white sm:text-xs"
          >
            Latest
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="flex h-11 shrink-0 snap-start items-center rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary sm:text-xs"
            >
              {category.label || category.name}
            </Link>
          ))}
          <Link
            href="/videos"
            className="flex h-11 shrink-0 snap-start items-center rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary sm:text-xs"
          >
            Videos
          </Link>
          <Link
            href="/search"
            className="flex h-11 shrink-0 snap-start items-center rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary sm:text-xs"
          >
            Search
          </Link>
        </nav>
        <nav className="hidden items-center gap-2 lg:flex">
          <Link
            href="/news"
            className="flex h-11 shrink-0 items-center rounded-full bg-secondary px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
          >
            Latest
          </Link>
          {primaryCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="flex h-11 shrink-0 items-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {category.label || category.name}
            </Link>
          ))}
          {overflowCategories.length ? (
            <details className="group relative shrink-0">
              <summary className="flex h-11 list-none cursor-pointer items-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary [&::-webkit-details-marker]:hidden">
                More
              </summary>
              <div className="absolute left-0 top-full z-50 mt-3 min-w-[220px] rounded-[var(--radius)] border border-border/80 bg-white p-2 shadow-[0_20px_50px_rgba(17,17,17,0.12)]">
                <div className="mb-1 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  More Sections
                </div>
                <div className="grid gap-1">
                  {overflowCategories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          ) : null}
          <Link
            href="/videos"
            className="flex h-11 shrink-0 items-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Videos
          </Link>
          <Link
            href="/search"
            className="flex h-11 shrink-0 items-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
