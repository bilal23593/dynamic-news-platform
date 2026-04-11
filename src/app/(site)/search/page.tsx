import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/shared/section-heading";
import { StoryCard } from "@/components/shared/story-card";
import { buildKeywords, buildSeoMetadata } from "@/lib/seo";
import { getSearchParam } from "@/lib/utils";
import { searchPublishedArticlesPage } from "@/server/cms/public";
import type { SearchParams } from "@/types";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: SearchParams;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = getSearchParam(params.q).trim();
  const title = query ? `Search: ${query}` : "Search";
  const description = query
    ? `Search results for ${query} across stories, sections, topics, and bylines on ${siteConfig.name}.`
    : `Search stories, tags, categories, and bylines across ${siteConfig.name}.`;

  return buildSeoMetadata({
    title,
    description,
    path: "/search",
    keywords: buildKeywords(siteConfig.defaultKeywords, ["site search", query]),
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = getSearchParam(params.q).trim();
  const pageNumber = Number(getSearchParam(params.page, "1")) || 1;
  const pageSize = 12;
  const search = query
    ? await searchPublishedArticlesPage(query, pageNumber, pageSize)
    : { total: 0, page: 1, pageSize, results: [] };
  const totalPages = Math.max(1, Math.ceil(search.total / pageSize));
  const currentPage = Math.min(Math.max(search.page, 1), totalPages);
  const results = search.results;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <SectionHeading title="Search" eyebrow="Archive" />
      <form className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input name="q" defaultValue={query} placeholder="Search headlines, tags, authors, or excerpts" />
        <Button type="submit">Search</Button>
      </form>

      {!query ? (
        <div className="rounded-[var(--radius)] border border-border/70 bg-white p-8 text-muted-foreground">
          Start with a name, topic, section, or keyword.
        </div>
      ) : results.length ? (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {results.length} of {search.total} results for <strong>{query}</strong>.
          </p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {results.map((article) => (
              <StoryCard key={article.slug} article={article} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            {currentPage > 1 ? (
              <Button asChild variant="outline">
                <Link href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}>Previous</Link>
              </Button>
            ) : null}
            {currentPage < totalPages ? (
              <Button asChild variant="outline">
                <Link href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}>Next</Link>
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-white p-8 text-muted-foreground">
          No stories matched <strong>{query}</strong>. Try a different keyword or browse a section.
        </div>
      )}
    </main>
  );
}
