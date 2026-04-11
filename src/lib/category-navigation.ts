export type NavigationCategoryRecord = {
  name: string;
  slug: string;
  label?: string | null;
  sortOrder?: number | null;
};

type NavigationDefaults = {
  label: string;
  sortOrder: number;
};

export const categoryNavigationDefaults: Record<string, NavigationDefaults> = {
  politics: {
    label: "Politics",
    sortOrder: 10,
  },
  weather: {
    label: "Weather",
    sortOrder: 20,
  },
  "local-news": {
    label: "Local",
    sortOrder: 30,
  },
  crime: {
    label: "Crime",
    sortOrder: 40,
  },
  world: {
    label: "World",
    sortOrder: 50,
  },
  sports: {
    label: "Sports",
    sortOrder: 60,
  },
  "business-economy": {
    label: "Business",
    sortOrder: 70,
  },
  technology: {
    label: "Tech",
    sortOrder: 80,
  },
  entertainment: {
    label: "Entertainment",
    sortOrder: 90,
  },
};

export function resolveCategoryNavigationMeta<T extends NavigationCategoryRecord>(category: T): T & {
  label: string;
  sortOrder: number;
} {
  const defaults = categoryNavigationDefaults[category.slug];
  const hasCustomSortOrder = typeof category.sortOrder === "number" && category.sortOrder > 0;
  const resolvedSortOrder = hasCustomSortOrder
    ? category.sortOrder
    : defaults?.sortOrder ?? (typeof category.sortOrder === "number" ? category.sortOrder : 999);

  return {
    ...category,
    label: category.label || defaults?.label || category.name,
    sortOrder: resolvedSortOrder,
  } as T & {
    label: string;
    sortOrder: number;
  };
}

export function sortNavigationCategories<T extends NavigationCategoryRecord>(categories: T[]) {
  return [...categories]
    .map((category) => resolveCategoryNavigationMeta(category))
    .sort((left, right) => {
      return (
        (left.sortOrder ?? 999) - (right.sortOrder ?? 999) ||
        left.name.localeCompare(right.name)
      );
    });
}
