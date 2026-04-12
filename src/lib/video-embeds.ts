import { siteConfig } from "@/config/site";

export type VideoProvider = "youtube" | "vimeo" | "rumble" | "tiktok" | "unknown";
export type VideoAvailability = "live" | "gone" | "unknown";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseUrl(value: string) {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

export function detectVideoProvider(value: string | null | undefined): VideoProvider {
  const url = value ? parseUrl(value) : null;
  const hostname = url?.hostname.replace(/^www\./, "") || "";

  if (hostname === "youtube.com" || hostname === "youtu.be" || hostname === "youtube-nocookie.com") {
    return "youtube";
  }

  if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
    return "vimeo";
  }

  if (hostname === "rumble.com") {
    return "rumble";
  }

  if (hostname === "tiktok.com" || hostname === "vm.tiktok.com") {
    return "tiktok";
  }

  return "unknown";
}

export function normalizeVideoEmbedUrl(value: string | null | undefined) {
  const url = value ? parseUrl(value) : null;
  if (!url) return null;

  url.hash = "";

  const provider = detectVideoProvider(url.toString());

  if (provider === "youtube") {
    const hostname = url.hostname.replace(/^www\./, "");
    const videoId =
      hostname === "youtu.be"
        ? url.pathname.replace(/^\/+/, "")
        : url.pathname.startsWith("/embed/")
          ? url.pathname.split("/")[2]
          : url.searchParams.get("v") || (url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : null);

    return videoId ? `https://www.youtube.com/embed/${videoId}` : url.toString();
  }

  if (provider === "vimeo") {
    if (url.hostname === "player.vimeo.com") {
      return url.toString();
    }

    const match = url.pathname.match(/\/(\d+)/);
    return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : url.toString();
  }

  return url.toString();
}

export function isDirectEmbeddableVideoUrl(value: string | null | undefined) {
  const normalized = normalizeVideoEmbedUrl(value);
  if (!normalized) return false;

  const provider = detectVideoProvider(normalized);
  if (provider === "youtube" || provider === "vimeo") return true;

  if (provider === "rumble") {
    const url = parseUrl(normalized);
    return Boolean(url?.pathname.startsWith("/embed/"));
  }

  return false;
}

export function extractVideoEmbedUrlsFromHtml(html: string) {
  const urls = new Set<string>();

  for (const match of html.matchAll(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    const normalized = normalizeVideoEmbedUrl(match[1]);
    if (normalized) {
      urls.add(normalized);
    }
  }

  return Array.from(urls);
}

export function replaceIframeUrlInHtml(html: string, targetUrl: string, replacementHtml: string) {
  const normalizedTargetUrl = normalizeVideoEmbedUrl(targetUrl) || targetUrl.trim();

  return html.replace(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>(?:<\/iframe>)?/gi, (match, src: string) => {
    const normalizedSrc = normalizeVideoEmbedUrl(src) || src.trim();
    return normalizedSrc === normalizedTargetUrl ? replacementHtml : match;
  });
}

export function injectVideoBlockIntoHtml(html: string, markup: string) {
  const firstParagraphMatch = html.match(/<\/p>/i);

  if (!firstParagraphMatch || firstParagraphMatch.index === undefined) {
    return `${markup}${html}`;
  }

  const insertionPoint = firstParagraphMatch.index + firstParagraphMatch[0].length;
  return `${html.slice(0, insertionPoint)}${markup}${html.slice(insertionPoint)}`;
}

export function buildVideoEmbedMarkup(value: string, title?: string) {
  const normalized = normalizeVideoEmbedUrl(value);
  if (!normalized || !isDirectEmbeddableVideoUrl(normalized)) {
    return null;
  }

  const iframeTitle = escapeHtml(title ? `${title} video` : "Embedded video");

  return `
<figure class="story-video-shell" data-video-provider="${detectVideoProvider(normalized)}">
  <div class="story-video-shell__media">
    <iframe
      src="${escapeHtml(normalized)}"
      title="${iframeTitle}"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
    ></iframe>
  </div>
</figure>`.trim();
}

export function buildVideoLinkMarkup(value: string, title?: string) {
  const normalized = normalizeVideoEmbedUrl(value);
  if (!normalized) return null;

  const provider = detectVideoProvider(normalized);
  const providerLabel =
    provider === "tiktok"
      ? "TikTok"
      : provider === "rumble"
        ? "Rumble"
        : provider === "youtube"
          ? "YouTube"
          : provider === "vimeo"
            ? "Vimeo"
            : "source";

  return `
<div class="story-video-link" data-video-provider="${provider}">
  <div class="story-video-shell__label">Video</div>
  <p class="story-video-link__text">${escapeHtml(title || "Open the original video on")} ${providerLabel}.</p>
  <a class="story-video-link__cta" href="${escapeHtml(normalized)}" rel="noopener noreferrer" target="_blank">Watch on ${providerLabel}</a>
</div>`.trim();
}

export function buildUnavailableVideoNoticeHtml(value: string | null | undefined) {
  const provider = detectVideoProvider(value);
  const providerLabel =
    provider === "rumble"
      ? "Rumble"
      : provider === "youtube"
        ? "YouTube"
        : provider === "vimeo"
          ? "Vimeo"
          : provider === "tiktok"
            ? "TikTok"
            : "source";

  return `
<div class="story-video-unavailable" data-video-provider="${provider}">
  <div class="story-video-shell__label">Video unavailable</div>
  <p class="story-video-unavailable__text">The original ${providerLabel} video is no longer available from the source publisher.</p>
</div>`.trim();
}

async function fetchVideoUrl(value: string, method: "HEAD" | "GET") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(value, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": `Mozilla/5.0 (${siteConfig.name})`,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getVideoEmbedAvailability(value: string | null | undefined): Promise<VideoAvailability> {
  const normalized = normalizeVideoEmbedUrl(value);
  if (!normalized) return "unknown";

  for (const method of ["HEAD", "GET"] as const) {
    try {
      const response = await fetchVideoUrl(normalized, method);

      if (response.status === 404 || response.status === 410) {
        return "gone";
      }

      if (response.ok || (response.status >= 300 && response.status < 400)) {
        return "live";
      }

      if ([401, 403, 405, 429].includes(response.status)) {
        continue;
      }
    } catch {
      continue;
    }
  }

  return "unknown";
}
