import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingArticlePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 lg:space-y-8 lg:px-6 lg:py-10">
      <div className="space-y-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-14 w-full max-w-4xl" />
        <Skeleton className="h-14 w-full max-w-3xl" />
        <Skeleton className="h-8 w-full max-w-2xl" />
        <Skeleton className="h-16 w-full max-w-xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        <div className="space-y-6 sm:space-y-8">
          <Skeleton className="aspect-[16/9] w-full rounded-[var(--radius)]" />
          <div className="rounded-[var(--radius)] border border-border/60 p-4 sm:p-7 lg:p-10">
            <Skeleton className="h-24 w-full rounded-[calc(var(--radius)-4px)]" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-[96%]" />
              <Skeleton className="h-5 w-[92%]" />
              <Skeleton className="h-5 w-[94%]" />
              <Skeleton className="h-5 w-[88%]" />
            </div>
          </div>
        </div>
        <div className="space-y-5 sm:space-y-6">
          <Skeleton className="h-48 w-full rounded-[var(--radius)]" />
          <Skeleton className="h-72 w-full rounded-[var(--radius)]" />
        </div>
      </div>
    </main>
  );
}
