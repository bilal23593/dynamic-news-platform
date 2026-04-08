import type { Prisma } from "@prisma/client";

import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  getAutomaticSelectionReasons,
  homepageSelectionRules,
  selectAutomaticHomepageItems,
  type AutomaticSectionInput,
} from "@/lib/homepage-selection";
import { compactNumber, formatDate, getSearchParam } from "@/lib/utils";
import { deleteHomepageSectionAction, saveHomepageSectionAction } from "@/server/cms/editor-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";
import type { PublicArticleSummary } from "@/types/cms";

const homepagePreviewInclude = {
  category: true,
  subCategory: true,
  author: {
    include: {
      avatar: true,
    },
  },
  featuredImage: true,
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.ArticleInclude;

type HomepagePreviewArticle = Prisma.ArticleGetPayload<{
  include: typeof homepagePreviewInclude;
}>;

function mapPreviewArticle(article: HomepagePreviewArticle): PublicArticleSummary {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    publishAt: article.publishAt,
    featuredImageUrl: article.featuredImage?.url,
    featuredImageAlt: article.featuredImage?.altText,
    imageCaption: article.imageCaption,
    videoEmbedUrl: article.videoEmbedUrl,
    viewCount: article.viewCount,
    readTime: article.readTime,
    breakingNews: article.breakingNews,
    trending: article.trending,
    featured: article.featured,
    popular: article.popular,
    category: {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
      color: article.category.color,
      label: article.category.label,
    },
    subCategory: article.subCategory
      ? {
          id: article.subCategory.id,
          name: article.subCategory.name,
          slug: article.subCategory.slug,
        }
      : null,
    author: {
      id: article.author.id,
      displayName: article.author.displayName,
      slug: article.author.slug,
      title: article.author.title,
      bio: article.author.bio,
      avatarUrl: article.author.avatar?.url,
      twitterUrl: article.author.twitterUrl,
    },
    tags: article.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
  };
}

function toSectionInput(section: {
  type: string;
  sourceType: string;
  limit: number;
  categoryId?: string | null;
  tagId?: string | null;
}): AutomaticSectionInput {
  return {
    type: section.type,
    sourceType: section.sourceType,
    limit: section.limit,
    categoryId: section.categoryId,
    tagId: section.tagId,
  };
}

function reasonVariant(reason: string): "default" | "secondary" | "destructive" | "success" | "dark" {
  if (reason === "Breaking") return "destructive";
  if (reason === "Trending") return "dark";
  if (reason === "Featured") return "default";
  if (reason === "Most Read" || reason === "Popular Flag" || reason === "High Views") return "secondary";
  return "success";
}

function SectionPreviewCard({
  title,
  description,
  items,
  sectionInput,
  liveCount,
}: {
  title: string;
  description: string;
  items: PublicArticleSummary[];
  sectionInput: AutomaticSectionInput;
  liveCount?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length ? (
          items.map((article, index) => {
            const reasons = getAutomaticSelectionReasons(article, sectionInput);

            return (
              <div key={article.slug} className="rounded-[var(--radius)] border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={liveCount && index >= liveCount ? "secondary" : "default"}>
                        {liveCount
                          ? index < liveCount
                            ? `Live Slot ${index + 1}`
                            : `Next Up ${index - liveCount + 1}`
                          : `Rank ${index + 1}`}
                      </Badge>
                      <Badge variant="secondary">{article.category.label || article.category.name}</Badge>
                    </div>
                    <div className="text-base font-semibold leading-6 text-foreground">{article.title}</div>
                    <div className="text-sm leading-6 text-muted-foreground">
                      {article.author.displayName} · {formatDate(article.publishAt)} · {compactNumber(article.viewCount)} views
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reasons.map((reason) => (
                    <Badge key={`${article.slug}-${reason}`} variant={reasonVariant(reason)}>
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            No stories currently qualify for this preview.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type Props = { searchParams: SearchParams };

export default async function HomepagePage({ searchParams }: Props) {
  await requirePermission("manage_homepage");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);

  const [sections, categories, tags, adSlots, articles, mostReadArticles] = await Promise.all([
    prisma.homepageSection.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.adSlot.findMany({ orderBy: { name: "asc" } }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishAt: "desc" },
      take: 120,
      include: homepagePreviewInclude,
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 24,
      include: homepagePreviewInclude,
    }),
  ]);
  const selected = sections.find((item) => item.id === editId);
  const heroSection = sections.find((item) => item.key === "home-hero") || sections.find((item) => item.type === "HERO");
  const selectedSettings =
    selected?.settings && typeof selected.settings === "object" && !Array.isArray(selected.settings)
      ? (selected.settings as Record<string, unknown>)
      : {};
  const previewArticles = articles.map(mapPreviewArticle);
  const previewMostReadArticles = mostReadArticles.map(mapPreviewArticle);
  const topStoriesLimit = heroSection?.limit ?? 4;
  const topStoriesPreview = heroSection
    ? selectAutomaticHomepageItems(
        {
          ...toSectionInput(heroSection),
          limit: Math.max(topStoriesLimit + 2, 6),
        },
        {
          all: previewArticles,
          mostRead: previewMostReadArticles,
        },
      )
    : [];
  const selectedPreview = selected
    ? selected.sourceType === "MANUAL"
      ? selected.items
          .map((item) => previewArticles.find((article) => article.id === item.articleId))
          .filter(Boolean) as PublicArticleSummary[]
      : selectAutomaticHomepageItems(
          {
            ...toSectionInput(selected),
            limit: Math.max(selected.limit, 6),
          },
          {
            all: previewArticles,
            mostRead: previewMostReadArticles,
          },
        )
    : [];

  return (
    <AdminShell title="Homepage Builder" description="Curate hero packages, breaking strips, category blocks, and ad-supported modules.">
      <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit Section" : "New Section"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveHomepageSectionAction} className="grid gap-4">
              <input type="hidden" name="id" value={selected?.id || ""} />
              <div className="grid gap-2">
                <Label htmlFor="key">Key</Label>
                <Input id="key" name="key" defaultValue={selected?.key} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={selected?.title} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selected?.description || ""} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="type">Section type</Label>
                  <select id="type" name="type" defaultValue={selected?.type} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                    {["HERO", "BREAKING_STRIP", "LATEST_NEWS", "TRENDING", "MOST_READ", "CATEGORY_BLOCK", "EDITOR_PICKS", "VIDEO_HIGHLIGHTS", "SPONSORED_BLOCK", "NEWSLETTER_CTA", "AD_SLOT_BLOCK"].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sourceType">Source</Label>
                  <select id="sourceType" name="sourceType" defaultValue={selected?.sourceType} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                    {["MANUAL", "LATEST", "TRENDING", "MOST_READ", "BREAKING", "FEATURED", "CATEGORY", "TAG", "VIDEO"].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="sortOrder">Sort order</Label>
                  <Input id="sortOrder" name="sortOrder" type="number" defaultValue={selected?.sortOrder ?? 0} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit">Limit</Label>
                  <Input id="limit" name="limit" type="number" defaultValue={selected?.limit ?? 4} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="layout">Layout variant</Label>
                  <select
                    id="layout"
                    name="layout"
                    defaultValue={typeof selectedSettings.layout === "string" ? selectedSettings.layout : ""}
                    className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3"
                  >
                    <option value="">Default</option>
                    {["cards", "dense", "split", "compact", "utility", "weather"].map((layout) => (
                      <option key={layout} value={layout}>
                        {layout}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eyebrow">Eyebrow label</Label>
                  <Input
                    id="eyebrow"
                    name="eyebrow"
                    defaultValue={typeof selectedSettings.eyebrow === "string" ? selectedSettings.eyebrow : ""}
                    placeholder="Live, Forecast, Local, Video..."
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="viewAllHref">View-all URL</Label>
                  <Input
                    id="viewAllHref"
                    name="viewAllHref"
                    defaultValue={typeof selectedSettings.viewAllHref === "string" ? selectedSettings.viewAllHref : ""}
                    placeholder="/category/metro"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="viewAllLabel">View-all label</Label>
                  <Input
                    id="viewAllLabel"
                    name="viewAllLabel"
                    defaultValue={typeof selectedSettings.viewAllLabel === "string" ? selectedSettings.viewAllLabel : ""}
                    placeholder="View more"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="ctaLabel">CTA label</Label>
                  <Input
                    id="ctaLabel"
                    name="ctaLabel"
                    defaultValue={typeof selectedSettings.ctaLabel === "string" ? selectedSettings.ctaLabel : ""}
                    placeholder="Watch live"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ctaHref">CTA URL</Label>
                  <Input
                    id="ctaHref"
                    name="ctaHref"
                    defaultValue={typeof selectedSettings.ctaHref === "string" ? selectedSettings.ctaHref : ""}
                    placeholder="/videos"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="promoText">Promo / utility text</Label>
                <Textarea
                  id="promoText"
                  name="promoText"
                  defaultValue={typeof selectedSettings.promoText === "string" ? selectedSettings.promoText : ""}
                  placeholder="Use this for live banners, weather explainers, app promos, or section-specific utility copy."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryId">Category filter</Label>
                <select id="categoryId" name="categoryId" defaultValue={selected?.categoryId || ""} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                  <option value="">None</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tagId">Tag filter</Label>
                <select id="tagId" name="tagId" defaultValue={selected?.tagId || ""} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                  <option value="">None</option>
                  {tags.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adSlotId">Ad slot</Label>
                <select id="adSlotId" name="adSlotId" defaultValue={selected?.adSlotId || ""} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                  <option value="">None</option>
                  {adSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manualArticleIds">Manual stories</Label>
                <select id="manualArticleIds" name="manualArticleIds" multiple defaultValue={selected?.items.map((item) => item.articleId || "").filter(Boolean)} className="min-h-[160px] rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3 py-2">
                  {articles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.title}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="enabled" defaultChecked={selected?.enabled ?? true} />
                Enabled
              </label>
              <SubmitButton>{selected ? "Update section" : "Create section"}</SubmitButton>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <SectionPreviewCard
            title="Top Stories Preview"
            description={`This uses the same automatic hero logic as the live homepage. The first ${topStoriesLimit} stories are live now, and the remaining preview items are next in line.`}
            items={topStoriesPreview}
            sectionInput={
              heroSection
                ? toSectionInput(heroSection)
                : { type: "HERO", sourceType: "FEATURED", limit: topStoriesLimit }
            }
            liveCount={topStoriesLimit}
          />

          {selected ? (
            <SectionPreviewCard
              title={`Selected Section Preview: ${selected.title}`}
              description={
                selected.sourceType === "MANUAL"
                  ? "This shows the saved manual story order for the section you are editing."
                  : "This shows the current automatic picks for the saved section you are editing."
              }
              items={selectedPreview}
              sectionInput={toSectionInput(selected)}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Homepage Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Layout</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>
                        <div className="font-semibold">{section.title}</div>
                        <div className="text-xs text-muted-foreground">{section.key}</div>
                      </TableCell>
                      <TableCell>{section.type}</TableCell>
                      <TableCell>{section.sourceType}</TableCell>
                      <TableCell>
                        {section.settings && typeof section.settings === "object" && !Array.isArray(section.settings)
                          ? String((section.settings as Record<string, unknown>).layout || "default")
                          : "default"}
                      </TableCell>
                      <TableCell>{section.enabled ? "Yes" : "No"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={`/admin/homepage?edit=${section.id}`}>Edit</a>
                        </Button>
                        <form action={deleteHomepageSectionAction}>
                          <input type="hidden" name="id" value={section.id} />
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automatic Selection Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {homepageSelectionRules.map((rule) => (
                <div key={rule.section} className="rounded-[var(--radius)] border border-border/70 bg-muted/20 p-4">
                  <div className="mb-2 text-sm font-semibold text-foreground">{rule.section}</div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{rule.appliesTo}</div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{rule.rule}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    <strong className="text-foreground">Ranking:</strong> {rule.ranking}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    <strong className="text-foreground">Fallback:</strong> {rule.fallback}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
