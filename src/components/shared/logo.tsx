import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex min-w-0 items-center text-foreground", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <span className="inline-flex min-w-0 items-stretch overflow-hidden rounded-[0.45rem] bg-black shadow-[0_12px_28px_rgba(17,17,17,0.16)] ring-1 ring-black/12">
        <span className="truncate px-3 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-white sm:px-4 sm:text-[22px]">
          {siteConfig.logoLabelPrimary}
        </span>
        <span
          className="shrink-0 px-2.5 py-2 text-[13px] font-black uppercase tracking-[0.04em] text-white sm:px-4 sm:text-[22px]"
          style={{ backgroundColor: siteConfig.brandRed }}
        >
          {siteConfig.logoLabelSecondary}
        </span>
      </span>
    </Link>
  );
}
