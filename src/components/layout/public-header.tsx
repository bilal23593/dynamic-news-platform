import Link from "next/link";

import { MobileMenu } from "@/components/layout/mobile-menu";
import { AdSlotBlock } from "@/components/shared/ad-slot-block";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import type { PublicAdSlot } from "@/types/cms";

type PublicCategory = { name: string; slug: string; label?: string | null };

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <circle cx="11" cy="11" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function MobileTopActionLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_10px_24px_rgba(17,17,17,0.07)] transition-colors hover:border-primary hover:text-primary"
    >
      {children}
    </Link>
  );
}

export function PublicHeader({
  categories,
  headerAd,
}: {
  categories: PublicCategory[];
  headerAd?: PublicAdSlot | null;
}) {
  const primaryCategories = categories.slice(0, 6);
  const overflowCategories = categories.slice(6);
  const mobileCategories = categories.slice(0, 10);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:gap-4 lg:px-6 lg:py-4">
        {headerAd ? <AdSlotBlock slot={headerAd} title={headerAd.sponsorLabel || "Sponsored"} /> : null}
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <Logo className="min-w-0 flex-1 max-w-[calc(100%-6.5rem)]" />
          <div className="flex items-center gap-2">
            <MobileTopActionLink href="/search" label="Search news">
              <SearchIcon />
            </MobileTopActionLink>
            <MobileMenu categories={mobileCategories} />
          </div>
        </div>
        <div className="hidden items-start justify-between gap-3 sm:items-center sm:gap-4 lg:flex">
          <Logo />
          <div className="hidden items-center gap-3 lg:flex">
            <div className="rounded-full border border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Fast reporting. Clean signal.
            </div>
            <Button asChild size="sm">
              <Link href="/advertise" prefetch={false}>Advertise</Link>
            </Button>
          </div>
        </div>
        <nav className="hidden items-center gap-2 lg:flex">
          <Link
            href="/news"
            prefetch={false}
            className="flex h-11 shrink-0 items-center rounded-full bg-secondary px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
          >
            Latest
          </Link>
          {primaryCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              prefetch={false}
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
                      prefetch={false}
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
            prefetch={false}
            className="flex h-11 shrink-0 items-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Videos
          </Link>
          <Link
            href="/search"
            prefetch={false}
            className="flex h-11 shrink-0 items-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
