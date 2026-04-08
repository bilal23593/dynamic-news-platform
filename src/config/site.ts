export const siteConfig = {
  name: "Redwire Daily",
  shortName: "Redwire",
  description:
    "A modern, production-ready newsroom platform built for fast-moving local and national coverage.",
  url: process.env.APP_URL || "http://localhost:3000",
  locale: "en_US",
  themeColor: "#b30d16",
  twitterHandle: "@redwiredaily",
  defaultOgImage: "/redwire-og.jpg",
  contactEmail: "newsroom@redwiredaily.com",
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

