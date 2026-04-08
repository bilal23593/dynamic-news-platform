import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { BreadcrumbTrail } from "@/components/shared/breadcrumb-trail";
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

  return {
    title: page.seoTitle || page.title,
    description: page.metaDescription || page.summary || "",
  };
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

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 lg:px-6">
      <BreadcrumbTrail items={[{ label: "Home", href: "/" }, { label: page.title }]} />
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
