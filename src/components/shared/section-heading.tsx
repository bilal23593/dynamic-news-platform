import type { Route } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  eyebrow,
  href,
  linkLabel = "More",
  className,
  titleClassName,
  eyebrowClassName,
  linkClassName,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  titleClassName?: string;
  eyebrowClassName?: string;
  linkClassName?: string;
}) {
  const isInternalHref = href?.startsWith("/");

  return (
    <div className={cn("flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4", className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <div className={cn("text-[11px] font-bold uppercase tracking-[0.2em] text-primary", eyebrowClassName)}>
            {eyebrow}
          </div>
        ) : null}
        <h2 className={cn("font-serif text-[1.8rem] font-black tracking-tight text-foreground sm:text-3xl", titleClassName)}>
          {title}
        </h2>
      </div>
      {href ? (
        isInternalHref ? (
          <Link
            href={href as Route}
            className={cn("inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:text-[#8d0f17]", linkClassName)}
          >
            {linkLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <a
            href={href}
            className={cn("inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:text-[#8d0f17]", linkClassName)}
          >
            {linkLabel}
            <ChevronRight className="h-4 w-4" />
          </a>
        )
      ) : null}
    </div>
  );
}
