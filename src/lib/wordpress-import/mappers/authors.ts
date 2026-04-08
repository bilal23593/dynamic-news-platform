import type { WordpressPostRecord } from "@/lib/wordpress-import/types";
import { slugify } from "@/lib/utils";

export function mapWordpressAuthors(posts: WordpressPostRecord[]) {
  const authors = new Map<string, { displayName: string; slug: string }>();

  posts.forEach((post) => {
    const displayName = post.authorName?.trim();
    if (!displayName) return;
    const slug = slugify(displayName);
    if (!authors.has(slug)) {
      authors.set(slug, { displayName, slug });
    }
  });

  return Array.from(authors.values());
}

