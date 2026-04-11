import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { buildKeywords, buildSeoMetadata, resolveCanonicalUrl } from "@/lib/seo";
import { getPublishedPageBySlug, getRedirectForPath } from "@/server/cms/public";

export const revalidate = 900;

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  const page = await getPublishedPageBySlug(path);
  if (!page) return {};

  return buildSeoMetadata({
    title: page.seoTitle || page.title,
    description: page.metaDescription || page.summary || `${page.title} on Redwire Daily.`,
    path: `/${page.slug}`,
    canonicalUrl: page.canonicalUrl,
    keywords: buildKeywords(page.title, page.summary || undefined, ["newsroom page", "publisher information"]),
  });
}

export default async function CatchAllCmsPage({ params }: Props) {
  const { slug } = await params;
  const pathname = `/${slug.join("/")}`;
  const legacyRedirect = await getRedirectForPath(pathname);

  if (legacyRedirect) {
    const destination = legacyRedirect.destinationPath as never;
    if (legacyRedirect.statusCode === 301) {
      permanentRedirect(destination);
    }
    redirect(destination);
  }

  if (slug.length !== 1) {
    notFound();
  }

  const page = await getPublishedPageBySlug(slug[0]);
  if (!page) notFound();

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": page.schemaType || "WebPage",
    name: page.title,
    description: page.metaDescription || page.summary || undefined,
    url: resolveCanonicalUrl(page.canonicalUrl, `/${page.slug}`),
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 lg:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <header className="space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">CMS Page</div>
        <h1 className="font-serif text-5xl font-black tracking-tight">{page.title}</h1>
        {page.summary ? <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{page.summary}</p> : null}
      </header>
      <article className="editorial-surface rounded-[var(--radius)] p-6 lg:p-8">
        <div className="story-copy" dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
      </article>
    </main>
  );
}
