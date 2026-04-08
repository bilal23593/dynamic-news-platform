'use client';

import { useActionState, useState } from "react";

import {
  SearchableMultiSelect,
  type SearchableOption,
} from "@/features/admin/components/searchable-multi-select";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { saveArticleAction } from "@/server/cms/editor-actions";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

type Option = { id: string; label: string };

export function ArticleEditorForm({
  article,
  categories,
  subcategories,
  authors,
  tagSeedOptions,
  media,
  relatedArticleSeedOptions,
}: {
  article?: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    excerpt: string;
    contentHtml: string;
    contentJson: string;
    categoryId: string;
    subCategoryId: string | null;
    authorId: string;
    status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
    publishAt: string;
    featuredImageId: string | null;
    ogImageId: string | null;
    imageCaption: string | null;
    videoEmbedUrl: string | null;
    seoTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    schemaType: string;
    allowComments: boolean;
    breakingNews: boolean;
    trending: boolean;
    featured: boolean;
    popular: boolean;
    relatedContentMode: "AUTOMATIC" | "MANUAL" | "HYBRID";
    relatedContentLimit: number;
    selectedTags: SearchableOption[];
    selectedRelatedArticles: SearchableOption[];
  };
  categories: Option[];
  subcategories: Array<Option & { categoryId: string }>;
  authors: Option[];
  tagSeedOptions: SearchableOption[];
  media: Option[];
  relatedArticleSeedOptions: SearchableOption[];
}) {
  const [state, action] = useActionState(saveArticleAction, initialState);
  const [contentHtml, setContentHtml] = useState(article?.contentHtml || "<p></p>");
  const [contentJson, setContentJson] = useState(article?.contentJson || "");
  const [categoryId, setCategoryId] = useState(article?.categoryId || categories[0]?.id || "");
  const [relatedMode, setRelatedMode] = useState<
    "AUTOMATIC" | "MANUAL" | "HYBRID"
  >(article?.relatedContentMode || "HYBRID");
  const filteredSubcategories = subcategories.filter((item) => item.categoryId === categoryId);

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="id" value={article?.id || ""} />
      <input type="hidden" name="contentHtml" value={contentHtml} />
      <input type="hidden" name="contentJson" value={contentJson} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Headline</Label>
              <Input id="title" name="title" defaultValue={article?.title} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={article?.slug} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea id="subtitle" name="subtitle" defaultValue={article?.subtitle || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" name="excerpt" defaultValue={article?.excerpt} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Story body</Label>
            <RichTextEditor
              initialContent={article?.contentHtml}
              onChange={({ html, json }) => {
                setContentHtml(html);
                setContentJson(json);
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 rounded-[var(--radius)] border border-border/70 bg-white p-5">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={article?.status || "DRAFT"} className="h-11 w-full rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                {["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="publishAt">Publish at</Label>
              <Input id="publishAt" name="publishAt" type="datetime-local" defaultValue={article?.publishAt} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-11 w-full rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subCategoryId">Subcategory</Label>
              <select id="subCategoryId" name="subCategoryId" defaultValue={article?.subCategoryId || ""} className="h-11 w-full rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                <option value="">None</option>
                {filteredSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="authorId">Author</Label>
              <select id="authorId" name="authorId" defaultValue={article?.authorId} className="h-11 w-full rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 rounded-[var(--radius)] border border-border/70 bg-white p-5">
            <div className="grid gap-2">
              <Label htmlFor="featuredImageId">Featured image</Label>
              <select id="featuredImageId" name="featuredImageId" defaultValue={article?.featuredImageId || ""} className="h-11 w-full rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                <option value="">None</option>
                {media.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ogImageId">OG image</Label>
              <select id="ogImageId" name="ogImageId" defaultValue={article?.ogImageId || ""} className="h-11 w-full rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                <option value="">None</option>
                {media.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageCaption">Image caption</Label>
              <Input id="imageCaption" name="imageCaption" defaultValue={article?.imageCaption || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoEmbedUrl">Video embed URL</Label>
              <Input id="videoEmbedUrl" name="videoEmbedUrl" defaultValue={article?.videoEmbedUrl || ""} />
            </div>
          </div>

          <div className="grid gap-4 rounded-[var(--radius)] border border-border/70 bg-white p-5">
            <SearchableMultiSelect
              name="tagIds"
              label="Topics / tags"
              description="Search and attach newsroom topics. These tags power related stories, tag pages, homepage sections, and future content clustering."
              searchEndpoint="/api/admin/lookup/tags"
              placeholder="Search topics like budget, health, elections..."
              defaultSelected={article?.selectedTags || []}
              initialOptions={tagSeedOptions}
              emptyLabel="No tags match your search."
            />
            <div className="grid gap-2">
              <Label htmlFor="relatedContentMode">Related stories strategy</Label>
              <select
                id="relatedContentMode"
                name="relatedContentMode"
                value={relatedMode}
                onChange={(event) =>
                  setRelatedMode(event.target.value as "AUTOMATIC" | "MANUAL" | "HYBRID")
                }
                className="h-11 w-full rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3"
              >
                <option value="HYBRID">Hybrid: pinned first, then automatic</option>
                <option value="AUTOMATIC">Automatic: tags and category only</option>
                <option value="MANUAL">Manual: pinned stories only</option>
              </select>
              <p className="text-sm leading-6 text-muted-foreground">
                Automatic related stories are ranked from shared tags first, then category context, then current newsroom priority.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="relatedContentLimit">Related stories count</Label>
              <Input
                id="relatedContentLimit"
                name="relatedContentLimit"
                type="number"
                min={2}
                max={8}
                defaultValue={article?.relatedContentLimit || 4}
              />
            </div>
            <SearchableMultiSelect
              name="relatedArticleIds"
              label="Pinned related stories"
              description={
                relatedMode === "AUTOMATIC"
                  ? "Optional pins are saved for later, but live related stories are currently driven by tags and category."
                  : relatedMode === "MANUAL"
                    ? "These pinned stories define the related module. If none are pinned, the site falls back automatically."
                    : "These pinned stories appear first, then the system fills any remaining slots automatically."
              }
              searchEndpoint={`/api/admin/lookup/articles${article?.id ? `?excludeId=${article.id}` : ""}`}
              placeholder="Search stories by headline, slug, or excerpt..."
              defaultSelected={article?.selectedRelatedArticles || []}
              initialOptions={relatedArticleSeedOptions}
              emptyLabel="No stories match your search."
            />
            <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Future-safe workflow: editors tag the story once, and the platform can reuse that topic data for related content, tag pages, homepage automation, and future recommendation systems.
            </div>
          </div>

          <div className="grid gap-4 rounded-[var(--radius)] border border-border/70 bg-white p-5">
            <div className="grid gap-2">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" name="seoTitle" defaultValue={article?.seoTitle || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="metaDescription">Meta description</Label>
              <Textarea id="metaDescription" name="metaDescription" defaultValue={article?.metaDescription || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input id="canonicalUrl" name="canonicalUrl" defaultValue={article?.canonicalUrl || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schemaType">Schema type</Label>
              <Input id="schemaType" name="schemaType" defaultValue={article?.schemaType || "NewsArticle"} />
            </div>
          </div>

          <div className="grid gap-2 rounded-[var(--radius)] border border-border/70 bg-white p-5 text-sm">
            {[
              { name: "allowComments", label: "Allow comments", checked: article?.allowComments ?? true },
              { name: "breakingNews", label: "Breaking news", checked: article?.breakingNews ?? false },
              { name: "trending", label: "Trending", checked: article?.trending ?? false },
              { name: "featured", label: "Featured", checked: article?.featured ?? false },
              { name: "popular", label: "Popular", checked: article?.popular ?? false },
            ].map((item) => (
              <label key={item.name} className="flex items-center gap-2 font-medium">
                <input type="checkbox" name={item.name} defaultChecked={item.checked} />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {state?.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <SubmitButton size="lg" className="w-full md:w-fit">
        {article ? "Save article" : "Create article"}
      </SubmitButton>
    </form>
  );
}
