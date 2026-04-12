import sanitizeHtml from "sanitize-html";
import { convert } from "html-to-text";

import type { PublicAdSlot } from "@/types/cms";
import { calculateReadTime } from "@/lib/utils";

type RichTextInput = {
  heading?: string;
  deck?: string;
  paragraphs: string[];
  bullets?: string[];
  quote?: string;
};

function textNode(text: string) {
  return {
    type: "text",
    text,
  };
}

function paragraphNode(text: string) {
  return {
    type: "paragraph",
    content: [textNode(text)],
  };
}

function headingNode(text: string, level: 2 | 3 = 2) {
  return {
    type: "heading",
    attrs: { level },
    content: [textNode(text)],
  };
}

export function createEditorDocument(input: RichTextInput) {
  const content: Record<string, unknown>[] = [];

  if (input.heading) {
    content.push(headingNode(input.heading, 2));
  }

  if (input.deck) {
    content.push(paragraphNode(input.deck));
  }

  for (const paragraph of input.paragraphs) {
    content.push(paragraphNode(paragraph));
  }

  if (input.bullets?.length) {
    content.push({
      type: "bulletList",
      content: input.bullets.map((bullet) => ({
        type: "listItem",
        content: [paragraphNode(bullet)],
      })),
    });
  }

  if (input.quote) {
    content.push({
      type: "blockquote",
      content: [paragraphNode(input.quote)],
    });
  }

  return {
    type: "doc",
    content,
  };
}

export function createRichContent(input: RichTextInput) {
  const htmlParts: string[] = [];

  if (input.heading) {
    htmlParts.push(`<h2>${input.heading}</h2>`);
  }

  if (input.deck) {
    htmlParts.push(`<p>${input.deck}</p>`);
  }

  for (const paragraph of input.paragraphs) {
    htmlParts.push(`<p>${paragraph}</p>`);
  }

  if (input.bullets?.length) {
    htmlParts.push(
      `<ul>${input.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>`,
    );
  }

  if (input.quote) {
    htmlParts.push(`<blockquote><p>${input.quote}</p></blockquote>`);
  }

  const html = sanitizeArticleHtml(htmlParts.join(""));
  const text = htmlToPlainText(html);

  return {
    json: createEditorDocument(input),
    html,
    text,
    readTime: calculateReadTime(text),
  };
}

export function sanitizeArticleHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "div",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "figure",
      "figcaption",
      "br",
      "iframe",
      "video",
      "source",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      div: ["class", "data-video-provider", "data-video-status"],
      p: ["class"],
      figure: ["class", "data-video-provider", "data-video-status"],
      figcaption: ["class"],
      img: ["src", "alt", "title"],
      iframe: ["src", "allowfullscreen", "title", "width", "height", "loading", "allow", "referrerpolicy", "class", "frameborder"],
      video: ["src", "controls", "playsinline", "preload", "poster", "class"],
      source: ["src", "type"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

export function htmlToPlainText(value: string) {
  return convert(value, {
    wordwrap: false,
    selectors: [{ selector: "a", options: { hideLinkHrefIfSameAsText: true } }],
  }).trim();
}

export function stripShortcodes(value: string) {
  return value.replace(/\[[^[\]]+]/g, "").trim();
}

function renderManagedAdMarkup(slot: PublicAdSlot) {
  const sponsorLabel = slot.sponsorLabel || "Sponsored";
  const advertiserLine = slot.advertiserName
    ? `<div class="story-advertiser">${slot.advertiserName}</div>`
    : "";
  const cta =
    slot.targetUrl && slot.ctaLabel
      ? `<div class="story-ad-cta-wrap"><a class="story-ad-cta" href="${slot.targetUrl}" rel="sponsored noopener" target="_blank">${slot.ctaLabel}</a></div>`
      : "";

  if (slot.codeHtml) {
    return `<div class="story-ad-slot" data-ad-slot="${slot.key}"><div class="story-ad-label">${sponsorLabel}</div>${advertiserLine}${slot.codeHtml}${cta}</div>`;
  }

  if (slot.imageUrl) {
    const image = `<img src="${slot.imageUrl}" alt="${slot.name}" class="story-ad-image" />`;
    const linkedImage = slot.targetUrl
      ? `<a href="${slot.targetUrl}" rel="sponsored noopener" target="_blank">${image}</a>`
      : image;
    return `<div class="story-ad-slot" data-ad-slot="${slot.key}"><div class="story-ad-label">${sponsorLabel}</div>${advertiserLine}${linkedImage}${cta}</div>`;
  }

  return "";
}

export function injectAdSlotsIntoHtml(html: string, slots: PublicAdSlot[]) {
  if (!slots.length || !html.includes("</p>")) {
    return html;
  }

  const sortedSlots = [...slots].sort(
    (left, right) =>
      (left.injectAfterParagraph ?? Number.MAX_SAFE_INTEGER) -
        (right.injectAfterParagraph ?? Number.MAX_SAFE_INTEGER) ||
      (left.displayOrder ?? 0) - (right.displayOrder ?? 0),
  );

  const groupedInsertions = new Map<number, string[]>();
  for (const slot of sortedSlots) {
    const insertionPoint = Math.max(slot.injectAfterParagraph ?? 2, 1);
    const markup = renderManagedAdMarkup(slot);
    if (!markup) continue;
    const entries = groupedInsertions.get(insertionPoint) || [];
    entries.push(markup);
    groupedInsertions.set(insertionPoint, entries);
  }

  const segments = html.split(/<\/p>/i);
  if (segments.length <= 1) {
    return `${html}${sortedSlots.map(renderManagedAdMarkup).join("")}`;
  }

  let rebuiltHtml = "";

  segments.forEach((segment, index) => {
    if (!segment.trim() && index === segments.length - 1) {
      return;
    }

    const hasClosingParagraph = index < segments.length - 1;
    rebuiltHtml += segment;

    if (hasClosingParagraph) {
      rebuiltHtml += "</p>";
    }

    const paragraphNumber = index + 1;
    if (groupedInsertions.has(paragraphNumber)) {
      rebuiltHtml += groupedInsertions.get(paragraphNumber)!.join("");
    }
  });

  const renderedParagraphs = segments.length - 1;
  const overflowAds = sortedSlots.filter(
    (slot) => (slot.injectAfterParagraph ?? 2) > renderedParagraphs,
  );

  if (overflowAds.length) {
    rebuiltHtml += overflowAds.map(renderManagedAdMarkup).join("");
  }

  return rebuiltHtml;
}
