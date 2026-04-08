import type { Metadata } from "next";
import { JetBrains_Mono, Merriweather, Source_Sans_3 } from "next/font/google";

import "@/app/globals.css";
import { absoluteUrl } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const headlineFont = Merriweather({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
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
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.twitterHandle,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headlineFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}

