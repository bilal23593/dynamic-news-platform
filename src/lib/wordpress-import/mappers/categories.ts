import type { WordpressPostRecord } from "@/lib/wordpress-import/types";
import { slugify } from "@/lib/utils";

export function mapWordpressCategories(posts: WordpressPostRecord[]) {
  const categories = new Map<string, { name: string; slug: string }>();
  const tags = new Map<string, { name: string; slug: string }>();

  posts.forEach((post) => {
    post.categories.forEach((item) => {
      const target = item.domain === "post_tag" ? tags : categories;
      const slug = item.slug || slugify(item.name);
      if (!target.has(slug)) {
        target.set(slug, { name: item.name, slug });
      }
    });
  });

  return {
    categories: Array.from(categories.values()),
    tags: Array.from(tags.values()),
  };
}

