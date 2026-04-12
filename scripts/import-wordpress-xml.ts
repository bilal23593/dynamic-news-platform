import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";
import type { MediaKind } from "@prisma/client";
import { XMLParser } from "fast-xml-parser";

import { resolveCategoryNavigationMeta } from "../src/lib/category-navigation";
import { env } from "../src/lib/env";
import { htmlToPlainText, sanitizeArticleHtml, stripShortcodes } from "../src/lib/content";
import { calculateReadTime, slugify } from "../src/lib/utils";
import { normalizeVideoEmbedUrl } from "../src/lib/video-embeds";
import { inferImportedArticleCategory } from "../src/lib/wordpress-import/services/category-inference";
import { prisma } from "../src/server/prisma";

type WpCategoryRef = {
  name: string;
  slug: string;
  domain: "category" | "post_tag";
};

type WpAttachmentRecord = {
  legacyId: string;
  legacyUrl: string;
  title: string;
  fileName: string;
  mimeType?: string;
  altText?: string;
  caption?: string;
};

type WpMediaRef = {
  legacyUrl: string;
  altText?: string;
  title?: string;
};

type WpPostRecord = {
  legacyId: string;
  legacyUrl?: string;
  title: string;
  slug: string;
  authorName: string;
  publishAt: Date;
  html: string;
  excerpt: string;
  allowComments: boolean;
  category: WpCategoryRef;
  tags: WpCategoryRef[];
  featuredImageUrl?: string;
  featuredImageCaption?: string;
  inlineMedia: WpMediaRef[];
  videoEmbedUrl?: string;
};

type WpPageRecord = {
  legacyId: string;
  legacySlug: string;
  legacyUrl?: string;
  slug: string;
  title: string;
  html: string;
  summary: string;
};

type ImportedMediaRecord = {
  id: string;
  url: string;
  legacyUrl: string;
};

type HomepageBinding = {
  enabled?: boolean;
  sourceType?: "MANUAL" | "LATEST" | "TRENDING" | "MOST_READ" | "BREAKING" | "FEATURED" | "CATEGORY" | "TAG" | "VIDEO";
  categorySlug?: string | null;
  tagSlug?: string | null;
};

const DEFAULT_XML_PATH = "C:/Users/Eng Muhammad Bilal/Downloads/newschannel3now.WordPress.2026-04-10.xml";
const MEDIA_CONCURRENCY = 6;
const PAGE_SLUG_MAP = new Map<string, string | null>([
  ["about-us", "about"],
  ["contact-us", "contact"],
  ["advertise-with-us", "advertise"],
  ["terms-of-service", "terms"],
  ["privacy-policy", "privacy-policy"],
  ["home", null],
]);

const HOMEPAGE_BINDINGS: Record<string, HomepageBinding> = {
  "home-live-now": {
    enabled: false,
    sourceType: "MANUAL",
  },
  "home-weather-center": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "weather",
  },
  "home-hero": {
    enabled: true,
    sourceType: "FEATURED",
  },
  "home-breaking": {
    enabled: true,
    sourceType: "BREAKING",
  },
  "home-latest-videos": {
    enabled: true,
    sourceType: "VIDEO",
  },
  "home-newsletter": {
    enabled: true,
    sourceType: "MANUAL",
  },
  "home-local-news": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "local-news",
  },
  "home-us-world": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "world",
  },
  "home-consumer": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "business-economy",
  },
  "home-good-day": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "local-news",
  },
  "home-seen-on-tv": {
    enabled: true,
    sourceType: "VIDEO",
  },
  "home-things-to-do": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "entertainment",
  },
  "home-sports": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "sports",
  },
  "home-money": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "business-economy",
  },
  "home-politics": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "politics",
  },
  "home-health": {
    enabled: false,
    sourceType: "TAG",
  },
  "home-entertainment": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "entertainment",
  },
  "home-video": {
    enabled: true,
    sourceType: "VIDEO",
  },
  "home-unusual": {
    enabled: false,
    sourceType: "MANUAL",
  },
  "home-investigations": {
    enabled: true,
    sourceType: "CATEGORY",
    categorySlug: "crime",
  },
  "home-sponsored": {
    enabled: true,
    sourceType: "MANUAL",
  },
  "home-most-read": {
    enabled: true,
    sourceType: "MOST_READ",
  },
};

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&#8230;/g, "...")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function normalizeText(value: unknown) {
  return decodeHtmlEntities(String(value || "").trim());
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    return url.toString();
  } catch {
    return value.trim();
  }
}

function safeDate(value: string | undefined) {
  if (!value || value.startsWith("0000-00-00")) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function findMetaValue(meta: unknown, key: string) {
  return toArray(meta).find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>)["wp:meta_key"] === key) as
    | Record<string, unknown>
    | undefined;
}

function detectVideoEmbedUrl(html: string) {
  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) {
    return normalizeVideoEmbedUrl(iframeMatch[1]) || undefined;
  }

  const urlMatch = html.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|rumble\.com|tiktok\.com)[^\s"'<>]+/i);
  return normalizeVideoEmbedUrl(urlMatch?.[0] || "") || undefined;
}

function extractInlineMedia(html: string) {
  const items: WpMediaRef[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    const rawTag = match[0];
    const legacyUrl = normalizeUrl(match[1]);
    if (!legacyUrl || seen.has(legacyUrl)) continue;

    const altMatch = rawTag.match(/\salt=["']([^"']*)["']/i);
    const titleMatch = rawTag.match(/\stitle=["']([^"']*)["']/i);

    items.push({
      legacyUrl,
      altText: altMatch?.[1] ? decodeHtmlEntities(altMatch[1]) : undefined,
      title: titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1]) : undefined,
    });
    seen.add(legacyUrl);
  }

  return items;
}

function getPrimaryCategory(categories: WpCategoryRef[]) {
  return categories.find((item) => item.domain === "category") || {
    name: "General News",
    slug: "general-news",
    domain: "category" as const,
  };
}

function deriveExcerpt(html: string) {
  const plain = htmlToPlainText(html);
  return plain.slice(0, 240).trim() || "Imported from WordPress.";
}

function mediaKindFromMimeType(mimeType: string | undefined): MediaKind {
  if (!mimeType) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType.startsWith("application/")) return "DOCUMENT";
  return "IMAGE";
}

function guessMimeType(extension: string) {
  switch (extension.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mp3":
      return "audio/mpeg";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

function extensionFromContentType(contentType: string) {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  switch (normalized) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    case "audio/mpeg":
      return ".mp3";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}

function buildStoredFileName(sourceUrl: string, preferredTitle?: string) {
  const parsed = new URL(sourceUrl);
  const originalName = path.basename(parsed.pathname) || "imported-asset";
  const extension = path.extname(originalName);
  const contentBase = slugify(preferredTitle || path.basename(originalName, extension) || "imported-asset").slice(0, 80) || "imported-asset";
  const hash = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 12);
  return `${contentBase}-${hash}${extension.toLowerCase()}`;
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function createManyInChunks<T>(
  values: T[],
  size: number,
  callback: (slice: T[]) => Promise<unknown>,
) {
  for (const slice of chunk(values, size)) {
    await callback(slice);
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  callback: (value: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= values.length) return;
      results[index] = await callback(values[index]!, index);
    }
  });

  await Promise.all(workers);
  return results;
}

function isRetryableDatabaseError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeCode = "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const message = error instanceof Error ? error.message : String(error);

  return (
    maybeCode === "P1001" ||
    /can't reach database server/i.test(message) ||
    /connection/i.test(message) ||
    /timeout/i.test(message)
  );
}

async function runWithRetries<T>(label: string, callback: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await callback();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryableDatabaseError(error)) {
        throw error;
      }

      console.warn(`${label} failed on attempt ${attempt}/${attempts}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    }
  }

  throw lastError;
}

async function ensureUploadsDirectory() {
  const absoluteDirectory = path.resolve(process.cwd(), env.MEDIA_DISK_ROOT);
  const workspaceRoot = process.cwd();

  if (!absoluteDirectory.startsWith(workspaceRoot)) {
    throw new Error(`Refusing to clear media directory outside workspace: ${absoluteDirectory}`);
  }

  await mkdir(absoluteDirectory, { recursive: true });

  return absoluteDirectory;
}

async function fetchWithRetry(url: string, attempt = 1): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    if (attempt >= 3) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    return fetchWithRetry(url, attempt + 1);
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadAsset(
  legacyUrl: string,
  preferredTitle: string | undefined,
  altText: string | undefined,
  caption: string | undefined,
) {
  const parsed = new URL(legacyUrl);
  const originalName = path.basename(parsed.pathname) || `imported-${randomUUID()}`;
  let fileName = buildStoredFileName(legacyUrl, preferredTitle);
  let extension = path.extname(fileName);
  const absoluteDirectory = path.resolve(process.cwd(), env.MEDIA_DISK_ROOT);
  const absolutePath = path.join(absoluteDirectory, fileName);

  try {
    const existing = await stat(absolutePath);
    if (existing.isFile()) {
      const mimeType = guessMimeType(extension || path.extname(originalName));

      return {
        kind: mediaKindFromMimeType(mimeType),
        title: preferredTitle || path.basename(originalName, path.extname(originalName)),
        altText,
        caption,
        fileName,
        originalName,
        mimeType,
        extension: extension || path.extname(originalName) || undefined,
        url: `${env.MEDIA_PUBLIC_BASE}/${fileName}`,
        storageProvider: "local",
        storagePath: absolutePath,
        bytes: existing.size,
      };
    }
  } catch {
    // File does not exist yet, continue with remote download.
  }

  const response = await fetchWithRetry(legacyUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type")?.split(";")[0] || "";

  if (!extension) {
    const guessed = extensionFromContentType(contentType);
    if (guessed) {
      fileName += guessed;
      extension = guessed;
    }
  }

  await writeFile(absolutePath, buffer);

  const mimeType = contentType || guessMimeType(extension || path.extname(originalName));

  return {
    kind: mediaKindFromMimeType(mimeType),
    title: preferredTitle || path.basename(originalName, path.extname(originalName)),
    altText,
    caption,
    fileName,
    originalName,
    mimeType,
    extension: extension || path.extname(originalName) || undefined,
    url: `${env.MEDIA_PUBLIC_BASE}/${fileName}`,
    storageProvider: "local",
    storagePath: absolutePath,
    bytes: buffer.byteLength,
  };
}

function parseWordpressExport(xml: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    removeNSPrefix: false,
    trimValues: true,
  });

  const document = parser.parse(xml);
  const items = toArray(document?.rss?.channel?.item);

  const attachments = new Map<string, WpAttachmentRecord>();
  for (const item of items) {
    if (item?.["wp:post_type"] !== "attachment") continue;
    const legacyId = normalizeText(item["wp:post_id"]);
    const legacyUrl = normalizeText(item["wp:attachment_url"]);
    if (!legacyId || !legacyUrl) continue;

    const altText = normalizeText(findMetaValue(item["wp:postmeta"], "_wp_attachment_image_alt")?.["wp:meta_value"]);
    attachments.set(legacyId, {
      legacyId,
      legacyUrl: normalizeUrl(legacyUrl),
      title: normalizeText(item.title) || path.basename(new URL(legacyUrl).pathname),
      fileName: path.basename(new URL(legacyUrl).pathname),
      mimeType: normalizeText(item["wp:post_mime_type"]) || undefined,
      altText: altText || undefined,
      caption: normalizeText(item["excerpt:encoded"]) || undefined,
    });
  }

  const posts: WpPostRecord[] = [];
  const pages: WpPageRecord[] = [];

  for (const item of items) {
    const postType = item?.["wp:post_type"];
    const status = normalizeText(item?.["wp:status"]);
    if (status !== "publish") continue;

    if (postType === "post") {
      const rawCategories = toArray(item.category)
        .map((category): WpCategoryRef | null => {
          const text = typeof category === "string" ? normalizeText(category) : normalizeText(category["#text"] || category.text);
          if (!text) return null;

          const domain =
            (typeof category === "string" ? "category" : normalizeText(category.domain)) === "post_tag"
              ? "post_tag"
              : "category";

          const slug = typeof category === "string" ? slugify(text) : slugify(normalizeText(category.nicename) || text);
          return {
            name: text,
            slug,
            domain,
          };
        })
        .filter(Boolean) as WpCategoryRef[];

      const category = getPrimaryCategory(rawCategories);
      const tags = rawCategories.filter((entry) => entry.domain === "post_tag");
      const rawHtml = normalizeText(item["content:encoded"]);
      const commentStatus = normalizeText(item["wp:comment_status"]);
      const thumbnailId = normalizeText(findMetaValue(item["wp:postmeta"], "_thumbnail_id")?.["wp:meta_value"]);
      const featuredImage = thumbnailId ? attachments.get(thumbnailId) : undefined;
      const cleanedHtml = sanitizeArticleHtml(stripShortcodes(rawHtml));
      const inlineMedia = extractInlineMedia(cleanedHtml);
      const excerpt = normalizeText(item["excerpt:encoded"]) || deriveExcerpt(cleanedHtml);
      const publishAt = safeDate(
        normalizeText(item["wp:post_date_gmt"]) || normalizeText(item["wp:post_date"]) || normalizeText(item.pubDate),
      );
      const rawSlug = normalizeText(item["wp:post_name"]);
      const slug = rawSlug || slugify(normalizeText(item.title) || normalizeText(item.link));

      posts.push({
        legacyId: normalizeText(item["wp:post_id"]),
        legacyUrl: normalizeText(item.link) || undefined,
        title: normalizeText(item.title) || "Imported story",
        slug,
        authorName: normalizeText(item["dc:creator"]) || "Imported Staff",
        publishAt,
        html: cleanedHtml,
        excerpt,
        allowComments: commentStatus !== "closed",
        category,
        tags,
        featuredImageUrl: featuredImage?.legacyUrl,
        featuredImageCaption: featuredImage?.caption,
        inlineMedia,
        videoEmbedUrl: detectVideoEmbedUrl(rawHtml),
      });
    }

    if (postType === "page") {
      const legacySlug = normalizeText(item["wp:post_name"]);
      const mappedSlug = PAGE_SLUG_MAP.has(legacySlug) ? PAGE_SLUG_MAP.get(legacySlug) : legacySlug;
      if (!mappedSlug) continue;

      const cleanedHtml = sanitizeArticleHtml(stripShortcodes(normalizeText(item["content:encoded"])));
      const summary = normalizeText(item["excerpt:encoded"]) || deriveExcerpt(cleanedHtml);
      pages.push({
        legacyId: normalizeText(item["wp:post_id"]),
        legacySlug,
        legacyUrl: normalizeText(item.link) || undefined,
        slug: mappedSlug,
        title: normalizeText(item.title) || "Imported page",
        html: cleanedHtml,
        summary,
      });
    }
  }

  return { posts, pages, attachments };
}

function collectMediaReferences(posts: WpPostRecord[], pages: WpPageRecord[]) {
  const media = new Map<string, { legacyUrl: string; title?: string; altText?: string; caption?: string }>();

  for (const post of posts) {
    if (post.featuredImageUrl) {
      media.set(post.featuredImageUrl, {
        legacyUrl: post.featuredImageUrl,
        title: post.title,
        caption: post.featuredImageCaption,
      });
    }

    for (const asset of post.inlineMedia) {
      if (!media.has(asset.legacyUrl)) {
        media.set(asset.legacyUrl, {
          legacyUrl: asset.legacyUrl,
          title: asset.title || post.title,
          altText: asset.altText,
        });
      }
    }
  }

  for (const page of pages) {
    for (const asset of extractInlineMedia(page.html)) {
      if (!media.has(asset.legacyUrl)) {
        media.set(asset.legacyUrl, {
          legacyUrl: asset.legacyUrl,
          title: asset.title || page.title,
          altText: asset.altText,
        });
      }
    }
  }

  return Array.from(media.values());
}

function rewriteHtmlWithImportedMedia(html: string, importedMedia: Map<string, ImportedMediaRecord>) {
  return html.replace(/(<(?:img|source|iframe|a)[^>]+(?:src|href)=["'])([^"']+)(["'])/gi, (match, prefix, rawUrl, suffix) => {
    const normalized = normalizeUrl(rawUrl);
    const mapped = importedMedia.get(normalized);
    if (!mapped) return match;
    return `${prefix}${mapped.url}${suffix}`;
  });
}

async function clearExistingNewsroomData() {
  console.log("Clearing previous newsroom content...");
  await ensureUploadsDirectory();

  await runWithRetries("delete comments", () => prisma.comment.deleteMany());
  await runWithRetries("delete article relations", () => prisma.articleRelation.deleteMany());
  await runWithRetries("delete article gallery items", () => prisma.articleGalleryItem.deleteMany());
  await runWithRetries("delete article tags", () => prisma.articleTag.deleteMany());
  await runWithRetries("delete legacy maps", () => prisma.legacyContentMap.deleteMany());
  await runWithRetries("delete import logs", () => prisma.importLog.deleteMany());
  await runWithRetries("delete import batches", () => prisma.importBatch.deleteMany());
  await runWithRetries("delete redirects", () => prisma.redirect.deleteMany());
  await runWithRetries("delete articles", () => prisma.article.deleteMany());
  await runWithRetries("delete pages", () => prisma.page.deleteMany());
  await runWithRetries("delete subcategories", () => prisma.subCategory.deleteMany());
  await runWithRetries("delete tags", () => prisma.tag.deleteMany());
  await runWithRetries("delete categories", () => prisma.category.deleteMany());
  await runWithRetries("delete authors", () => prisma.authorProfile.deleteMany());
  await runWithRetries("delete media", () => prisma.media.deleteMany());
}

async function importMediaReferences(
  mediaRefs: Array<{ legacyUrl: string; title?: string; altText?: string; caption?: string }>,
  batchId: string,
) {
  console.log(`Importing ${mediaRefs.length} media assets...`);
  const importedMedia = new Map<string, ImportedMediaRecord>();
  const legacyMaps: Prisma.LegacyContentMapCreateManyInput[] = [];
  let failures = 0;

  await mapWithConcurrency(mediaRefs, MEDIA_CONCURRENCY, async (asset, index) => {
    try {
      const localAsset = await downloadAsset(asset.legacyUrl, asset.title, asset.altText, asset.caption);
      const created = await runWithRetries(`create media ${asset.legacyUrl}`, () => prisma.media.create({
        data: {
          id: randomUUID(),
          kind: localAsset.kind,
          title: localAsset.title,
          altText: localAsset.altText,
          caption: localAsset.caption,
          fileName: localAsset.fileName,
          originalName: localAsset.originalName,
          mimeType: localAsset.mimeType,
          extension: localAsset.extension,
          url: localAsset.url,
          storageProvider: localAsset.storageProvider,
          storagePath: localAsset.storagePath,
          bytes: localAsset.bytes,
          legacyUrl: asset.legacyUrl,
        },
      }));

      importedMedia.set(asset.legacyUrl, {
        id: created.id,
        url: created.url,
        legacyUrl: asset.legacyUrl,
      });

      legacyMaps.push({
        batchId,
        sourceType: "WORDPRESS_XML",
        legacyEntityType: "MEDIA",
        legacyId: asset.legacyUrl,
        legacyUrl: asset.legacyUrl,
        newMediaId: created.id,
        status: "imported",
      });
    } catch (error) {
      failures += 1;
      console.warn(`Media ${index + 1}/${mediaRefs.length} failed, keeping remote URL: ${asset.legacyUrl}`);
      const extension = path.extname(new URL(asset.legacyUrl).pathname);
      const mimeType = guessMimeType(extension);
      const created = await runWithRetries(`create remote fallback media ${asset.legacyUrl}`, () => prisma.media.create({
        data: {
          id: randomUUID(),
          kind: mediaKindFromMimeType(mimeType),
          title: asset.title || path.basename(new URL(asset.legacyUrl).pathname),
          altText: asset.altText,
          caption: asset.caption,
          fileName:
            path.basename(new URL(asset.legacyUrl).pathname) ||
            `remote-${createHash("sha1").update(asset.legacyUrl).digest("hex").slice(0, 10)}`,
          originalName: path.basename(new URL(asset.legacyUrl).pathname) || "remote-asset",
          mimeType,
          extension: extension || undefined,
          url: asset.legacyUrl,
          storageProvider: "remote",
          storagePath: asset.legacyUrl,
          legacyUrl: asset.legacyUrl,
        },
      }));

      importedMedia.set(asset.legacyUrl, {
        id: created.id,
        url: created.url,
        legacyUrl: asset.legacyUrl,
      });

      legacyMaps.push({
        batchId,
        sourceType: "WORDPRESS_XML",
        legacyEntityType: "MEDIA",
        legacyId: asset.legacyUrl,
        legacyUrl: asset.legacyUrl,
        newMediaId: created.id,
        status: "remote-fallback",
      });

      await runWithRetries(`log media fallback ${asset.legacyUrl}`, () => prisma.importLog.create({
        data: {
          batchId,
          level: "WARN",
          entityType: "media",
          entityIdentifier: asset.legacyUrl,
          message: "Media download failed; kept remote URL instead.",
          payload: {
            error: error instanceof Error ? error.message : String(error),
          },
        },
      }));
    }

    if ((index + 1) % 100 === 0 || index + 1 === mediaRefs.length) {
      console.log(`Imported ${index + 1}/${mediaRefs.length} media records...`);
    }
  });

  await createManyInChunks(legacyMaps, 500, async (slice) => {
    await runWithRetries("create media legacy maps", () => prisma.legacyContentMap.createMany({ data: slice }));
  });

  return { importedMedia, failures };
}

async function rebindHomepageSections(categoryMap: Map<string, string>, tagMap: Map<string, string>) {
  console.log("Rebinding homepage sections to imported taxonomy...");
  const sections = await runWithRetries("load homepage sections", () =>
    prisma.homepageSection.findMany({
      select: { id: true, key: true },
    }),
  );

  for (const section of sections) {
    const binding = HOMEPAGE_BINDINGS[section.key];
    if (!binding) continue;

    const categoryId =
      binding.categorySlug === undefined ? undefined : binding.categorySlug ? categoryMap.get(binding.categorySlug) || null : null;
    const tagId = binding.tagSlug === undefined ? undefined : binding.tagSlug ? tagMap.get(binding.tagSlug) || null : null;
    const shouldEnable =
      binding.enabled !== undefined
        ? binding.enabled &&
          (binding.sourceType !== "CATEGORY" || Boolean(categoryId)) &&
          (binding.sourceType !== "TAG" || Boolean(tagId))
        : true;

    await runWithRetries(`update homepage section ${section.key}`, () => prisma.homepageSection.update({
      where: { id: section.id },
      data: {
        enabled: shouldEnable,
        sourceType: binding.sourceType,
        categoryId,
        tagId,
      },
    }));
  }
}

async function main() {
  const xmlPath = process.argv[2] || DEFAULT_XML_PATH;
  console.log(`Reading WordPress export from ${xmlPath}`);
  const xml = await readFile(xmlPath, "utf8");
  const parsed = parseWordpressExport(xml);

  console.log(
    `Parsed ${parsed.posts.length} published posts, ${parsed.pages.length} published pages, and ${parsed.attachments.size} attachments.`,
  );

  await clearExistingNewsroomData();

  const importBatch = await runWithRetries("create import batch", () =>
    prisma.importBatch.create({
      data: {
        sourceType: "WORDPRESS_XML",
        status: "RUNNING",
        title: "One-time WordPress XML replacement import",
        fileName: path.basename(xmlPath),
        sourceUrl: xmlPath,
        dryRun: false,
        startedAt: new Date(),
        stats: {
          postsDetected: parsed.posts.length,
          pagesDetected: parsed.pages.length,
          attachmentsDetected: parsed.attachments.size,
        },
      },
    }),
  );

  const categoryValues = Array.from(
    new Map(
      parsed.posts.map((post) => [
        post.category.slug,
        resolveCategoryNavigationMeta({
          id: randomUUID(),
          name: post.category.name,
          slug: post.category.slug,
        }),
      ]),
    ).values(),
  );

  const tagValues = Array.from(
    new Map(
      parsed.posts.flatMap((post) => post.tags).map((tag) => [
        tag.slug,
        {
          id: randomUUID(),
          name: tag.name,
          slug: tag.slug,
        },
      ]),
    ).values(),
  );

  const authorValues = Array.from(
    new Map(
      parsed.posts.map((post) => [
        slugify(post.authorName),
        {
          id: randomUUID(),
          displayName: post.authorName,
          slug: slugify(post.authorName),
          bio: `${post.authorName} imported during the one-time WordPress migration.`,
          shortBio: "Imported newsroom author",
          legacyWpAuthor: post.authorName,
        },
      ]),
    ).values(),
  );

  console.log(`Creating ${categoryValues.length} categories, ${tagValues.length} tags, and ${authorValues.length} authors...`);
  await runWithRetries("create categories", () => prisma.category.createMany({ data: categoryValues }));
  await createManyInChunks(tagValues, 500, async (slice) => {
    await runWithRetries("create tags chunk", () => prisma.tag.createMany({ data: slice }));
  });
  await runWithRetries("create authors", () => prisma.authorProfile.createMany({ data: authorValues }));

  const categoryMap = new Map(categoryValues.map((category) => [category.slug, category.id]));
  const tagMap = new Map(tagValues.map((tag) => [tag.slug, tag.id]));
  const authorMap = new Map(authorValues.map((author) => [author.slug, author.id]));

  const mediaRefs = collectMediaReferences(parsed.posts, parsed.pages);
  const { importedMedia, failures: mediaFailures } = await importMediaReferences(mediaRefs, importBatch.id);

  console.log("Importing articles...");
  const articleLegacyMaps: Prisma.LegacyContentMapCreateManyInput[] = [];
  const redirectValues: Prisma.RedirectCreateManyInput[] = [];

  const newestTimestamp = Math.max(...parsed.posts.map((post) => post.publishAt.getTime()));
  const sortedPosts = [...parsed.posts].sort((left, right) => right.publishAt.getTime() - left.publishAt.getTime());
  const featuredSlugs = new Set(sortedPosts.slice(0, 24).map((post) => post.slug));
  const popularSlugs = new Set(sortedPosts.slice(0, 48).map((post) => post.slug));
  const trendingSlugs = new Set(
    sortedPosts
      .filter((post) => Boolean(post.videoEmbedUrl) || post.tags.length >= 3)
      .slice(0, 48)
      .map((post) => post.slug),
  );
  const breakingSlugs = new Set(
    sortedPosts
      .filter((post) => newestTimestamp - post.publishAt.getTime() <= 1000 * 60 * 60 * 36)
      .slice(0, 12)
      .map((post) => post.slug),
  );

  for (let index = 0; index < parsed.posts.length; index += 1) {
    const post = parsed.posts[index]!;
    const contentHtml = rewriteHtmlWithImportedMedia(post.html, importedMedia);
    const contentText = htmlToPlainText(contentHtml);
    const featuredImageId = post.featuredImageUrl ? importedMedia.get(post.featuredImageUrl)?.id : undefined;
    const authorSlug = slugify(post.authorName);
    const tagIds = post.tags.map((tag) => tagMap.get(tag.slug)).filter(Boolean) as string[];
    const inferredCategory = inferImportedArticleCategory({
      title: post.title,
      excerpt: post.excerpt,
      contentText,
      currentCategorySlug: post.category.slug,
      tagSlugs: post.tags.map((tag) => tag.slug),
      tagNames: post.tags.map((tag) => tag.name),
    });
    const categorySlug = inferredCategory.resolvedCategorySlug || post.category.slug;
    const categoryId = categoryMap.get(categorySlug) || categoryMap.get(post.category.slug);
    const articleId = randomUUID();

    if (!categoryId) {
      throw new Error(`Missing imported category for slug: ${categorySlug}`);
    }

    const categoryWeight = (() => {
      switch (categorySlug) {
        case "politics":
          return 7_500;
        case "world":
          return 7_000;
        case "weather":
          return 6_000;
        case "local-news":
          return 5_500;
        case "crime":
          return 5_000;
        default:
          return 4_500;
      }
    })();

    const viewCount = Math.max(
      500,
      categoryWeight + (tagIds.length * 120) + (post.videoEmbedUrl ? 1_200 : 0) + Math.max(0, 2_500 - index),
    );

    await runWithRetries(`create article ${post.slug}`, () => prisma.article.create({
      data: {
        id: articleId,
        importBatchId: importBatch.id,
        legacyPostId: post.legacyId,
        legacySlug: post.slug,
        legacyAuthorName: post.authorName,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentHtml,
        contentJson: Prisma.JsonNull,
        contentText,
        featuredImageId,
        imageCaption: post.featuredImageCaption,
        videoEmbedUrl: post.videoEmbedUrl,
        categoryId,
        authorId: authorMap.get(authorSlug) || authorValues[0]!.id,
        status: "PUBLISHED",
        publishAt: post.publishAt,
        breakingNews: breakingSlugs.has(post.slug),
        trending: trendingSlugs.has(post.slug),
        featured: featuredSlugs.has(post.slug),
        popular: popularSlugs.has(post.slug),
        seoTitle: post.title,
        metaDescription: post.excerpt.slice(0, 160),
        schemaType: "NewsArticle",
        viewCount,
        readTime: calculateReadTime(contentText),
        allowComments: post.allowComments,
        ogImageId: featuredImageId,
      },
    }));

    if (tagIds.length) {
      await runWithRetries(`create article tags ${post.slug}`, () => prisma.articleTag.createMany({
        data: tagIds.map((tagId) => ({
          articleId,
          tagId,
        })),
      }));
    }

    articleLegacyMaps.push({
      batchId: importBatch.id,
      sourceType: "WORDPRESS_XML",
      legacyEntityType: "ARTICLE",
      legacyId: post.legacyId,
      legacySlug: post.slug,
      legacyUrl: post.legacyUrl,
      newArticleId: articleId,
      status: "imported",
    });

    if (post.legacyUrl) {
      const sourcePath = new URL(post.legacyUrl).pathname;
      redirectValues.push({
        sourcePath,
        destinationPath: `/article/${post.slug}`,
        statusCode: 301,
        active: true,
        notes: "Generated during one-time WordPress XML migration.",
      });
    }

    if ((index + 1) % 100 === 0 || index + 1 === parsed.posts.length) {
      console.log(`Imported ${index + 1}/${parsed.posts.length} articles...`);
    }
  }

  console.log("Importing mapped static pages...");
  const pageLegacyMaps: Prisma.LegacyContentMapCreateManyInput[] = [];
  for (const page of parsed.pages) {
    const contentHtml = rewriteHtmlWithImportedMedia(page.html, importedMedia);
    const created = await runWithRetries(`create page ${page.slug}`, () => prisma.page.create({
      data: {
        id: randomUUID(),
        legacyPageId: page.legacyId,
        legacySlug: page.legacySlug,
        title: page.title,
        slug: page.slug,
        summary: page.summary.slice(0, 240),
        contentHtml,
        contentJson: Prisma.JsonNull,
        status: "PUBLISHED",
        seoTitle: page.title,
        metaDescription: page.summary.slice(0, 160),
        canonicalUrl: null,
        schemaType: "WebPage",
        showInFooter: true,
        showInHeader: page.slug === "about" || page.slug === "contact" || page.slug === "advertise",
      },
    }));

    pageLegacyMaps.push({
      batchId: importBatch.id,
      sourceType: "WORDPRESS_XML",
      legacyEntityType: "PAGE",
      legacyId: page.legacyId,
      legacySlug: page.legacySlug,
      legacyUrl: page.legacyUrl,
      newPageId: created.id,
      status: "imported",
    });

    if (page.legacyUrl) {
      const sourcePath = new URL(page.legacyUrl).pathname;
      const destinationPath = `/${page.slug}`;
      if (sourcePath !== destinationPath) {
        redirectValues.push({
          sourcePath,
          destinationPath,
          statusCode: 301,
          active: true,
          notes: "Generated during one-time WordPress XML migration.",
        });
      }
    }
  }

  await createManyInChunks(articleLegacyMaps.concat(pageLegacyMaps), 500, async (slice) => {
    await runWithRetries("create article/page legacy maps", () => prisma.legacyContentMap.createMany({ data: slice }));
  });

  const uniqueRedirects = Array.from(new Map(redirectValues.map((redirect) => [redirect.sourcePath, redirect])).values());
  await createManyInChunks(uniqueRedirects, 500, async (slice) => {
    await runWithRetries("create redirects", () => prisma.redirect.createMany({ data: slice }));
  });

  await rebindHomepageSections(categoryMap, tagMap);

  await runWithRetries("create import log", () => prisma.importLog.create({
    data: {
      batchId: importBatch.id,
      level: "INFO",
      entityType: "wordpress-import",
      message: `Imported ${parsed.posts.length} posts, ${parsed.pages.length} pages, ${mediaRefs.length} media records, and ${uniqueRedirects.length} redirects.`,
      payload: {
        mediaFailures,
      },
    },
  }));

  await runWithRetries("finalize import batch", () => prisma.importBatch.update({
    where: { id: importBatch.id },
    data: {
      status: mediaFailures ? "PARTIAL" : "COMPLETED",
      finishedAt: new Date(),
      stats: {
        postsImported: parsed.posts.length,
        pagesImported: parsed.pages.length,
        mediaImported: mediaRefs.length,
        mediaFailures,
        redirectsCreated: uniqueRedirects.length,
        categoriesImported: categoryValues.length,
        tagsImported: tagValues.length,
        authorsImported: authorValues.length,
      },
    },
  }));

  console.log("WordPress XML import completed.");
  console.log(
    JSON.stringify(
      {
        postsImported: parsed.posts.length,
        pagesImported: parsed.pages.length,
        categoriesImported: categoryValues.length,
        tagsImported: tagValues.length,
        authorsImported: authorValues.length,
        mediaImported: mediaRefs.length,
        mediaFailures,
        redirectsCreated: uniqueRedirects.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
