import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

type SeoMetadataInput = {
  title: string;
  description: string;
  path?: string;
  canonicalUrl?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  keywords?: string[];
  type?: "website" | "article";
  section?: string;
  authorNames?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
};

function normalizeKeyword(keyword: string) {
  return keyword.replace(/\s+/g, " ").trim();
}

export function buildKeywords(
  ...groups: Array<string | null | undefined | readonly (string | null | undefined)[]>
) {
  const values = groups.flatMap((group) => (Array.isArray(group) ? group : [group]));
  const uniqueKeywords = new Set<string>();

  for (const value of values) {
    if (!value) continue;

    const normalized = normalizeKeyword(value);
    if (!normalized || normalized.length > 80) continue;

    uniqueKeywords.add(normalized);

    if (uniqueKeywords.size >= 18) {
      break;
    }
  }

  return Array.from(uniqueKeywords);
}

export function resolveCanonicalUrl(canonicalUrl: string | null | undefined, fallbackPath = "/") {
  const candidate = canonicalUrl?.trim() || fallbackPath;

  try {
    return new URL(candidate).toString();
  } catch {
    return absoluteUrl(candidate);
  }
}

export function buildSeoMetadata({
  title,
  description,
  path = "/",
  canonicalUrl,
  imageUrl,
  imageAlt,
  keywords = [],
  type = "website",
  section,
  authorNames,
  publishedTime,
  modifiedTime,
  noIndex = false,
}: SeoMetadataInput): Metadata {
  const canonical = resolveCanonicalUrl(canonicalUrl, path);
  const shareImage = resolveCanonicalUrl(imageUrl || siteConfig.defaultOgImage, path);

  const openGraph: Metadata["openGraph"] =
    type === "article"
      ? {
          type: "article",
          title,
          description,
          url: canonical,
          siteName: siteConfig.name,
          locale: siteConfig.locale,
          images: [{ url: shareImage, alt: imageAlt || title }],
          authors: authorNames,
          publishedTime,
          modifiedTime,
          section,
          tags: keywords,
        }
      : {
          type: "website",
          title,
          description,
          url: canonical,
          siteName: siteConfig.name,
          locale: siteConfig.locale,
          images: [{ url: shareImage, alt: imageAlt || title }],
        };

  return {
    title,
    description,
    keywords,
    category: section,
    alternates: {
      canonical,
    },
    authors: authorNames?.map((name) => ({ name })),
    creator: authorNames?.[0] || siteConfig.name,
    publisher: siteConfig.name,
    robots: noIndex
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: siteConfig.twitterHandle,
      images: [shareImage],
    },
  };
}

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.contactEmail,
    sameAs: siteConfig.sameAs,
    logo: absoluteUrl(siteConfig.logoPath),
  };
}

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
