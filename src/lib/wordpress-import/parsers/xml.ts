import { XMLParser } from "fast-xml-parser";

import type { WordpressCategoryRef, WordpressPostRecord } from "@/lib/wordpress-import/types";
import { extractInlineMedia } from "@/lib/wordpress-import/transformers/html";
import { slugify } from "@/lib/utils";

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function optionalString(value: unknown) {
  return value === null || value === undefined || value === "" ? undefined : String(value);
}

export function parseWordpressXml(payload: string): WordpressPostRecord[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    removeNSPrefix: true,
    trimValues: true,
  });

  const document = parser.parse(payload);
  const items = toArray(document?.rss?.channel?.item);

  return items
    .filter((item) => item.post_type === "post")
    .map((item) => {
      const categories = toArray(item.category).map((category): WordpressCategoryRef => ({
        name: typeof category === "string" ? category : category["#text"] || category.text || "Uncategorized",
        slug: typeof category === "string" ? slugify(category) : category.nicename,
        domain: (typeof category === "string" ? "category" : category.domain) === "post_tag" ? "post_tag" : "category",
      }));

      const html = item["encoded"] || item.description || "";
      const media = extractInlineMedia(html);

      return {
        sourceId: String(item.post_id || item.guid || item.link || item.title),
        title: item.title || "Untitled import",
        slug: item.post_name || slugify(item.title || "imported-post"),
        excerpt: item["encoded"] || item.excerpt || item.description || "",
        html,
        publishDate: optionalString(item.post_date_gmt || item.post_date || item.pubDate),
        authorName: optionalString(item.creator),
        status: optionalString(item.status),
        categories,
        media,
        featuredImageUrl: media[0]?.url,
        legacyUrl: optionalString(item.link),
      } satisfies WordpressPostRecord;
    });
}
