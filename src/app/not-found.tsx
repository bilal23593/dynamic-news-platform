import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        404
      </div>
      <h1 className="font-serif text-5xl font-black tracking-tight">This story moved or never made the page.</h1>
      <p className="max-w-xl text-lg leading-8 text-muted-foreground">
        Try the latest news feed, browse a section, or head back to the homepage to keep the reporting
        moving.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/news">Latest news</Link>
        </Button>
      </div>
    </main>
  );
}

