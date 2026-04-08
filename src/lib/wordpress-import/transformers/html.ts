import { createRichContent, htmlToPlainText, stripShortcodes } from "@/lib/content";
import type { WordpressMediaRef } from "@/lib/wordpress-import/types";

export function extractInlineMedia(html: string): WordpressMediaRef[] {
  const matches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi));
  return matches.map((match) => ({
    url: match[1],
  }));
}

export function transformWordpressHtmlToEditorBlocks(html: string) {
  const cleaned = stripShortcodes(html);
  const text = htmlToPlainText(cleaned);
  const paragraphs = text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const rich = createRichContent({
    paragraphs: paragraphs.length ? paragraphs.slice(0, 12) : ["Imported content."],
  });

  return {
    json: rich.json,
    html: cleaned,
    text,
    readTime: rich.readTime,
    inlineMedia: extractInlineMedia(cleaned),
  };
}

