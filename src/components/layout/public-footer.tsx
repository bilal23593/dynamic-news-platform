import Link from "next/link";

import { AdSlotBlock } from "@/components/shared/ad-slot-block";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
import type { PublicAdSlot } from "@/types/cms";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/advertise", label: "Advertise" },
] as const;

export function PublicFooter({
  footerAd,
  categories,
}: {
  footerAd?: PublicAdSlot | null;
  categories?: Array<{ name: string; slug: string; label?: string | null }>;
}) {
  const coverageLinks = (categories || []).slice(0, 6);

  return (
    <footer className="mt-20 border-t border-border/70 bg-[#111111] text-white">
      {footerAd ? (
        <div className="mx-auto max-w-7xl px-4 pt-8 lg:px-6">
          <AdSlotBlock slot={footerAd} title={footerAd.sponsorLabel || "Sponsored"} />
        </div>
      ) : null}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-6">
        <div className="space-y-4">
          <Logo className="text-white" />
          <p className="max-w-md text-sm leading-7 text-white/70">
            {siteConfig.name} is a digital-first newsroom built for rapid publishing, stronger metadata,
            cleaner workflows, and always-on breaking coverage.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {siteConfig.contactEmail}
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Coverage</h3>
          <div className="grid gap-2 text-sm text-white/80">
            {coverageLinks.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`}>
                {category.label || category.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Company</h3>
          <div className="grid gap-2 text-sm text-white/80">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
