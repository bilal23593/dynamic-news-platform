import type { WordpressPostRecord } from "@/lib/wordpress-import/types";
import { extractInlineMedia } from "@/lib/wordpress-import/transformers/html";
import { slugify } from "@/lib/utils";

export function parseWordpressCsv(payload: string): WordpressPostRecord[] {
  const [headerLine, ...rows] = payload.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((item) => item.trim());

  return rows.map((row, index) => {
    const values = row.split(",");
    const record = Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex]?.trim() || ""]));
    const html = record.content || "";

    return {
      sourceId: record.id || `${index + 1}`,
      title: record.title || `Imported row ${index + 1}`,
      slug: record.slug || slugify(record.title || `import-${index + 1}`),
      excerpt: record.excerpt,
      html,
      publishDate: record.publishDate,
      authorName: record.author,
      status: record.status,
      categories: record.category ? [{ name: record.category, slug: slugify(record.category), domain: "category" }] : [],
      media: extractInlineMedia(html),
      featuredImageUrl: record.featuredImageUrl || extractInlineMedia(html)[0]?.url,
      legacyUrl: record.legacyUrl,
    } satisfies WordpressPostRecord;
  });
}
