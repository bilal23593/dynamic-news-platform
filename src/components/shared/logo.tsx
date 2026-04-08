import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-3 text-foreground", className)}
      aria-label="Redwire Daily home"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-black text-white">
        R
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-2xl font-black tracking-tight">Redwire</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.32em] opacity-70">
          Daily
        </span>
      </span>
    </Link>
  );
}
