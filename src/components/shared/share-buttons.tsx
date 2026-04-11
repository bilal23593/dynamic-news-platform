"use client";

import { Link2, Mail, MessageCircle, Plus, Printer } from "lucide-react";
import { useState } from "react";

import { siteConfig } from "@/config/site";
import { absoluteUrl, cn } from "@/lib/utils";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M13.5 21v-7h2.3l.5-3h-2.8V9.1c0-1 .3-1.7 1.8-1.7H16V4.8c-.3 0-1-.1-2-.1-2.1 0-3.5 1.3-3.5 3.8V11H8v3h2.5v7h3Z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M17.7 3H21l-7.2 8.2L22 21h-6.4l-5-6-5.2 6H2l7.7-8.8L2 3h6.5l4.5 5.5L17.7 3Zm-1.1 16h1.8L7.5 4.9H5.6L16.6 19Z"
      />
    </svg>
  );
}

function actionButtonClassName(backgroundClassName: string) {
  return cn(
    "inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_8px_18px_rgba(17,17,17,0.10)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    backgroundClassName,
  );
}

export function ShareButtons({ path, title }: { path: string; title: string }) {
  const url = absoluteUrl(path);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const [copied, setCopied] = useState(false);
  const followHref = siteConfig.googleNewsUrl || "/news";
  const followLabel = siteConfig.googleNewsUrl ? "Add Redwire on Google News" : "Follow Redwire Updates";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on Facebook"
        className={actionButtonClassName("bg-[#1877F2]")}
      >
        <FacebookIcon className="h-5 w-5" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on X"
        className={actionButtonClassName("bg-black")}
      >
        <XIcon className="h-5 w-5" />
      </a>
      <a
        href={`${path}#comments`}
        aria-label="Jump to comments"
        className={actionButtonClassName("bg-secondary")}
      >
        <MessageCircle className="h-5 w-5" />
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="Print story"
        className={actionButtonClassName("bg-[#0f4c8a]")}
      >
        <Printer className="h-5 w-5" />
      </button>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        aria-label="Share by email"
        className={actionButtonClassName("bg-[#1f5f99]")}
      >
        <Mail className="h-5 w-5" />
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy story link"
        className={actionButtonClassName(copied ? "bg-primary" : "bg-[#174a82]")}
      >
        <Link2 className="h-5 w-5" />
      </button>
      <a
        href={followHref}
        target={siteConfig.googleNewsUrl ? "_blank" : undefined}
        rel={siteConfig.googleNewsUrl ? "noreferrer" : undefined}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0f4c8a] px-4.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(17,17,17,0.10)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="h-4 w-4" />
        <span className="whitespace-nowrap">{followLabel}</span>
      </a>
    </div>
  );
}
