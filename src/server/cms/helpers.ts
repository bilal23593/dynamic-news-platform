import { prisma } from "@/server/prisma";
import { slugify } from "@/lib/utils";

export async function ensureUniqueSlug(
  model:
    | "category"
    | "tag"
    | "subCategory"
    | "authorProfile"
    | "article"
    | "page",
  source: string,
  excludeId?: string,
) {
  const base = slugify(source) || "item";
  let candidate = base;
  let attempt = 1;
  const modelDelegate = prisma[model] as unknown as {
    findUnique(args: { where: { slug: string }; select: { id: true } }): Promise<{ id: string } | null>;
  };

  while (true) {
    const existing = await modelDelegate.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export function parseCommaSeparated(value: string | null | undefined) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function booleanFromForm(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

export function optionalString(value: FormDataEntryValue | null) {
  const normalized = String(value || "").trim();
  return normalized ? normalized : undefined;
}
