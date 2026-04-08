import Link from "next/link";

import { AdSlotBlock } from "@/components/shared/ad-slot-block";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import type { PublicAdSlot } from "@/types/cms";

export function PublicHeader({
  categories,
  headerAd,
}: {
  categories: Array<{ name: string; slug: string }>;
  headerAd?: PublicAdSlot | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6">
        {headerAd ? <AdSlotBlock slot={headerAd} title={headerAd.sponsorLabel || "Sponsored"} /> : null}
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <div className="hidden items-center gap-3 lg:flex">
            <div className="rounded-full border border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Fast reporting. Clean signal.
            </div>
            <Button asChild size="sm">
              <Link href="/advertise">Advertise</Link>
            </Button>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/news"
            className="rounded-full bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
          >
            Latest
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/videos"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Videos
          </Link>
          <Link
            href="/search"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
