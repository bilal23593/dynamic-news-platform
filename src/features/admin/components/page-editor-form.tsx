'use client';

import { useActionState, useState } from "react";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { savePageAction } from "@/server/cms/editor-actions";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export function PageEditorForm({
  page,
  media,
}: {
  page?: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    contentHtml: string;
    contentJson: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    seoTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    schemaType: string;
    ogImageId: string | null;
    showInHeader: boolean;
    showInFooter: boolean;
  };
  media: Array<{ id: string; label: string }>;
}) {
  const [state, action] = useActionState(savePageAction, initialState);
  const [contentHtml, setContentHtml] = useState(page?.contentHtml || "<p></p>");
  const [contentJson, setContentJson] = useState(page?.contentJson || "");

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="id" value={page?.id || ""} />
      <input type="hidden" name="contentHtml" value={contentHtml} />
      <input type="hidden" name="contentJson" value={contentJson} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={page?.title} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={page?.slug} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" name="summary" defaultValue={page?.summary || ""} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Page body</Label>
            <RichTextEditor
              initialContent={page?.contentHtml}
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
              <select id="status" name="status" defaultValue={page?.status || "DRAFT"} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                {["DRAFT", "PUBLISHED", "ARCHIVED"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ogImageId">OG image</Label>
              <select id="ogImageId" name="ogImageId" defaultValue={page?.ogImageId || ""} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                <option value="">None</option>
                {media.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" name="seoTitle" defaultValue={page?.seoTitle || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="metaDescription">Meta description</Label>
              <Textarea id="metaDescription" name="metaDescription" defaultValue={page?.metaDescription || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input id="canonicalUrl" name="canonicalUrl" defaultValue={page?.canonicalUrl || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schemaType">Schema type</Label>
              <Input id="schemaType" name="schemaType" defaultValue={page?.schemaType || "WebPage"} />
            </div>
          </div>
          <div className="grid gap-2 rounded-[var(--radius)] border border-border/70 bg-white p-5 text-sm">
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" name="showInHeader" defaultChecked={page?.showInHeader ?? false} />
              Show in header
            </label>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" name="showInFooter" defaultChecked={page?.showInFooter ?? true} />
              Show in footer
            </label>
          </div>
        </div>
      </div>

      {state?.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <SubmitButton size="lg" className="w-full md:w-fit">
        {page ? "Save page" : "Create page"}
      </SubmitButton>
    </form>
  );
}
