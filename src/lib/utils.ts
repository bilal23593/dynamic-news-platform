import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

import { siteConfig } from "@/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: Date | string | null | undefined, pattern = "MMM d, yyyy") {
  if (!value) return "";
  return format(new Date(value), pattern);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "";
  return format(new Date(value), "MMM d, yyyy 'at' h:mm a");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function absoluteUrl(path = "") {
  return new URL(path || "/", siteConfig.url).toString();
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function stripTrailingSlash(input: string) {
  return input === "/" ? input : input.replace(/\/+$/, "");
}

export function ensureLeadingSlash(input: string) {
  return input.startsWith("/") ? input : `/${input}`;
}

export function commaSeparated(values: string[]) {
  return values.filter(Boolean).join(", ");
}

export function take<T>(values: T[], count: number) {
  return values.slice(0, count);
}

export function getSearchParam(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

