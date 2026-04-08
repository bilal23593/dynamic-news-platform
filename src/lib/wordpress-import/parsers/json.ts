import type { WordpressPostRecord } from "@/lib/wordpress-import/types";
import { extractInlineMedia } from "@/lib/wordpress-import/transformers/html";
import { slugify } from "@/lib/utils";

function optionalString(value: unknown) {
  return value === null || value === undefined || value === "" ? undefined : String(value);
}

export function parseWordpressJson(payload: string): WordpressPostRecord[] {
  const parsed = JSON.parse(payload) as
    | Record<string, unknown>
    | Array<Record<string, unknown>>;
  const items = Array.isArray(parsed)
    ? parsed
    : ((parsed.posts as Array<Record<string, unknown>> | undefined) ||
        (parsed.items as Array<Record<string, unknown>> | undefined) ||
        []);

  return items.map((item) => {
    const contentValue = item.content;
    const titleValue = item.title;
    const excerptValue = item.excerpt;
    const html =
      typeof contentValue === "object" && contentValue && "rendered" in contentValue
        ? String(contentValue.rendered || "")
        : String(contentValue || item.html || "");

    return {
      sourceId:
        String(item.id || item.slug || (typeof titleValue === "object" && titleValue && "rendered" in titleValue ? titleValue.rendered : titleValue) || "json-post"),
      title:
        (typeof titleValue === "object" && titleValue && "rendered" in titleValue
          ? String(titleValue.rendered || "")
          : String(titleValue || "Untitled import")) || "Untitled import",
      slug:
        String(item.slug || slugify((typeof titleValue === "object" && titleValue && "rendered" in titleValue ? String(titleValue.rendered || "") : String(titleValue || "json-post")))),
      excerpt:
        typeof excerptValue === "object" && excerptValue && "rendered" in excerptValue
          ? String(excerptValue.rendered || "")
          : String(excerptValue || ""),
      html,
      publishDate: optionalString(item.date_gmt || item.date),
      authorName: String(item.author_name || item.author || ""),
      status: optionalString(item.status),
      categories: ((item.categories as unknown[]) || (item.taxonomies as unknown[]) || []).flatMap((value) =>
        typeof value === "string"
          ? [{ name: value, slug: slugify(value), domain: "category" as const }]
          : [],
      ),
      media: extractInlineMedia(html),
      featuredImageUrl: optionalString(item.featured_image_url) || extractInlineMedia(html)[0]?.url,
      legacyUrl: optionalString(item.link || item.url),
    } satisfies WordpressPostRecord;
  });
}
