import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "@/app/globals.css";
import { absoluteUrl } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { buildKeywords, getOrganizationJsonLd, getWebsiteJsonLd } from "@/lib/seo";

const bodyFont = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    {
      path: "../assets/fonts/source-sans-3-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/source-sans-3-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../assets/fonts/source-sans-3-700.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/fonts/source-sans-3-800.ttf",
      weight: "800",
      style: "normal",
    },
  ],
});

const headlineFont = localFont({
  variable: "--font-headline",
  display: "swap",
  src: [
    {
      path: "../assets/fonts/merriweather-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/merriweather-700.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/fonts/merriweather-900.ttf",
      weight: "900",
      style: "normal",
    },
  ],
});

const monoFont = localFont({
  variable: "--font-mono",
  display: "swap",
  src: [
    {
      path: "../assets/fonts/jetbrains-mono-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/jetbrains-mono-700.ttf",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: buildKeywords(siteConfig.name, siteConfig.shortName, siteConfig.defaultKeywords),
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
    locale: siteConfig.locale,
    url: absoluteUrl("/"),
    images: [
      {
        url: absoluteUrl(siteConfig.defaultOgImage),
        alt: `${siteConfig.name} newsroom sharing image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
    images: [absoluteUrl(siteConfig.defaultOgImage)],
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = getOrganizationJsonLd();
  const websiteJsonLd = getWebsiteJsonLd();

  return (
    <html lang={siteConfig.language} className={`${bodyFont.variable} ${headlineFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
