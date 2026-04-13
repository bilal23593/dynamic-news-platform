import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const wordmark = `${siteConfig.logoLabelPrimary}${siteConfig.logoLabelSecondary}`;
  const colorSplit = "71.5%";

  return (
    <Link
      href="/"
      className={cn("inline-flex min-w-0 items-center text-foreground", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <span
        className="inline-flex min-w-0 items-center overflow-hidden rounded-[0.45rem] shadow-[0_12px_28px_rgba(17,17,17,0.16)] ring-1 ring-black/12"
        style={{
          background: `linear-gradient(90deg, #000000 0%, #000000 ${colorSplit}, ${siteConfig.brandRed} ${colorSplit}, ${siteConfig.brandRed} 100%)`,
        }}
      >
        <span
          className="truncate whitespace-nowrap px-3 py-2 text-[13px] font-black uppercase tracking-[0.06em] text-white sm:px-4 sm:text-[22px]"
        >
          {wordmark}
        </span>
      </span>
    </Link>
  );
}
