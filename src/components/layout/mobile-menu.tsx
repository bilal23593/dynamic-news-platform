"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PublicCategory = { name: string; slug: string; label?: string | null };

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function MobileMenu({ categories }: { categories: PublicCategory[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const featuredLinks = [
    { href: "/news", label: "Latest News" },
    { href: "/videos", label: "Videos" },
    { href: "/search", label: "Search News" },
    { href: "/advertise", label: "Advertise" },
  ];

  function closeMenu() {
    setOpen(false);
  }

  function toggleMenu() {
    setOpen((current) => !current);
  }

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={toggleMenu}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_10px_24px_rgba(17,17,17,0.07)] transition-colors hover:border-primary hover:text-primary"
      >
        <MenuIcon />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-transparent"
          />
          <div className="absolute right-0 top-full z-50 mt-3 w-[min(92vw,22rem)] rounded-[var(--radius)] border border-border/80 bg-white p-3 shadow-[0_24px_60px_rgba(17,17,17,0.14)]">
            <div className="mb-3 border-b border-border/70 pb-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Menu</div>
              <div className="text-sm font-semibold text-muted-foreground">
                Browse sections, search, and publishing links.
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {featuredLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={closeMenu}
                  className="inline-flex min-h-11 items-center rounded-full bg-secondary px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2a2a2a]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Coverage
              </div>
              <div className="grid gap-1">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    prefetch={false}
                    onClick={closeMenu}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    {category.label || category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
