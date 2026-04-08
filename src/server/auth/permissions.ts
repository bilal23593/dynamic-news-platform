export const permissionMatrix = {
  SUPER_ADMIN: [
    "manage_articles",
    "publish_articles",
    "manage_taxonomy",
    "manage_media",
    "manage_pages",
    "manage_homepage",
    "manage_comments",
    "manage_subscribers",
    "manage_redirects",
    "manage_ads",
    "manage_settings",
    "manage_imports",
    "manage_users",
  ],
  EDITOR: [
    "manage_articles",
    "publish_articles",
    "manage_taxonomy",
    "manage_media",
    "manage_pages",
    "manage_homepage",
    "manage_comments",
    "manage_subscribers",
    "manage_redirects",
    "manage_ads",
  ],
  AUTHOR: ["manage_articles", "manage_media"],
  MODERATOR: ["manage_comments", "manage_subscribers"],
} as const;

export type AppRole = keyof typeof permissionMatrix;
export type AppPermission = (typeof permissionMatrix)[AppRole][number];

export function hasPermission(role: string | null | undefined, permission: AppPermission) {
  if (!role) return false;
  const permissions = permissionMatrix[role as AppRole] as readonly AppPermission[] | undefined;
  return permissions?.includes(permission) ?? false;
}

export const adminNavigation = [
  {
    href: "/admin",
    label: "Dashboard",
    permission: "manage_articles",
  },
  {
    href: "/admin/articles",
    label: "Articles",
    permission: "manage_articles",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    permission: "manage_taxonomy",
  },
  {
    href: "/admin/subcategories",
    label: "Subcategories",
    permission: "manage_taxonomy",
  },
  {
    href: "/admin/tags",
    label: "Tags",
    permission: "manage_taxonomy",
  },
  {
    href: "/admin/authors",
    label: "Authors",
    permission: "manage_articles",
  },
  {
    href: "/admin/media",
    label: "Media",
    permission: "manage_media",
  },
  {
    href: "/admin/pages",
    label: "Pages",
    permission: "manage_pages",
  },
  {
    href: "/admin/comments",
    label: "Comments",
    permission: "manage_comments",
  },
  {
    href: "/admin/homepage",
    label: "Homepage",
    permission: "manage_homepage",
  },
  {
    href: "/admin/subscribers",
    label: "Subscribers",
    permission: "manage_subscribers",
  },
  {
    href: "/admin/redirects",
    label: "Redirects",
    permission: "manage_redirects",
  },
  {
    href: "/admin/ads",
    label: "Ads",
    permission: "manage_ads",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    permission: "manage_settings",
  },
  {
    href: "/admin/imports",
    label: "Imports",
    permission: "manage_imports",
  },
  {
    href: "/admin/users",
    label: "Users",
    permission: "manage_users",
  },
] satisfies Array<{ href: string; label: string; permission: AppPermission }>;
