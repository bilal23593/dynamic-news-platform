function resolveSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL;

  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

export const siteConfig = {
  name: "NEWS CHANNEL3 NOW",
  shortName: "NEWS CHANNEL3 NOW",
  description:
    "A digital-first news platform delivering breaking updates, live coverage, and fast-moving local-to-national reporting.",
  url: resolveSiteUrl(),
  locale: "en_US",
  language: "en-US",
  themeColor: "#ff1020",
  twitterHandle: "@newschannel3now",
  googleNewsUrl: process.env.NEXT_PUBLIC_GOOGLE_NEWS_URL || "",
  defaultOgImage: "/opengraph-image",
  logoPath: "/icon",
  contactEmail: "news@newschannel3now.com",
  sameAs: ["https://twitter.com/newschannel3now"],
  logoMark: "3",
  logoLabelPrimary: "NEWS CHANNEL3",
  logoLabelSecondary: "NOW",
  brandRed: "#ff1020",
  defaultKeywords: [
    "breaking news",
    "channel 3 news",
    "live news",
    "local news",
    "politics",
    "crime",
    "weather",
    "business news",
    "sports news",
    "video news",
    "digital newsroom",
  ],
  navCategories: ["Politics", "Metro", "Investigations", "Business", "Sports", "Weather"],
} as const;

export const staticPageSlugs = [
  "about",
  "contact",
  "privacy-policy",
  "terms",
  "disclaimer",
  "advertise",
] as const;

export const homepageSectionTypeLabels = {
  HERO: "Hero",
  BREAKING_STRIP: "Breaking Strip",
  LATEST_NEWS: "Latest News",
  TRENDING: "Trending",
  MOST_READ: "Most Read",
  CATEGORY_BLOCK: "Category Block",
  EDITOR_PICKS: "Editor Picks",
  VIDEO_HIGHLIGHTS: "Video Highlights",
  SPONSORED_BLOCK: "Sponsored Block",
  NEWSLETTER_CTA: "Newsletter CTA",
  AD_SLOT_BLOCK: "Ad Slot Block",
} as const;
