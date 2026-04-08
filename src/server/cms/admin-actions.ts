'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requirePermission } from "@/server/auth/session";
import {
  refreshAdCaches,
  refreshArticleCaches,
  refreshAuthorCaches,
  refreshCategoryCaches,
  refreshHomepageCaches,
  refreshPageCaches,
  refreshRedirectCaches,
  refreshTagCaches,
} from "@/server/cms/cache";
import { prisma } from "@/server/prisma";
import { booleanFromForm, ensureUniqueSlug, optionalString } from "@/server/cms/helpers";

const simpleNameSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export async function saveCategoryAction(formData: FormData) {
  await requirePermission("manage_taxonomy");
  const parsed = simpleNameSchema.extend({
    color: z.string().trim().optional(),
    label: z.string().trim().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
  }).parse({
    id: optionalString(formData.get("id")),
    name: formData.get("name"),
    slug: optionalString(formData.get("slug")),
    description: optionalString(formData.get("description")),
    color: optionalString(formData.get("color")),
    label: optionalString(formData.get("label")),
    sortOrder: Number(formData.get("sortOrder") || 0),
  });

  const previousCategory = parsed.id
    ? await prisma.category.findUnique({
        where: { id: parsed.id },
        select: { slug: true },
      })
    : null;

  const slug = await ensureUniqueSlug("category", parsed.slug || parsed.name, parsed.id);

  await prisma.category.upsert({
    where: { id: parsed.id || "new-category" },
    update: {
      name: parsed.name,
      slug,
      description: parsed.description,
      color: parsed.color,
      label: parsed.label,
      sortOrder: parsed.sortOrder,
    },
    create: {
      name: parsed.name,
      slug,
      description: parsed.description,
      color: parsed.color,
      label: parsed.label,
      sortOrder: parsed.sortOrder,
    },
  });

  refreshCategoryCaches([previousCategory?.slug, slug].filter(Boolean) as string[]);

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requirePermission("manage_taxonomy");
  const id = String(formData.get("id") || "");
  if (id) {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { slug: true },
    });

    await prisma.category.delete({ where: { id } });

    refreshCategoryCaches(category?.slug ? [category.slug] : []);
  }
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function saveSubCategoryAction(formData: FormData) {
  await requirePermission("manage_taxonomy");
  const parsed = simpleNameSchema.extend({
    categoryId: z.string().min(1),
    color: z.string().trim().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
  }).parse({
    id: optionalString(formData.get("id")),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    slug: optionalString(formData.get("slug")),
    description: optionalString(formData.get("description")),
    color: optionalString(formData.get("color")),
    sortOrder: Number(formData.get("sortOrder") || 0),
  });

  const previousSubCategory = parsed.id
    ? await prisma.subCategory.findUnique({
        where: { id: parsed.id },
        select: { category: { select: { slug: true } } },
      })
    : null;

  const slug = await ensureUniqueSlug("subCategory", parsed.slug || parsed.name, parsed.id);

  await prisma.subCategory.upsert({
    where: { id: parsed.id || "new-subcategory" },
    update: {
      categoryId: parsed.categoryId,
      name: parsed.name,
      slug,
      description: parsed.description,
      color: parsed.color,
      sortOrder: parsed.sortOrder,
    },
    create: {
      categoryId: parsed.categoryId,
      name: parsed.name,
      slug,
      description: parsed.description,
      color: parsed.color,
      sortOrder: parsed.sortOrder,
    },
  });

  const nextCategory = await prisma.category.findUnique({
    where: { id: parsed.categoryId },
    select: { slug: true },
  });

  refreshCategoryCaches(
    [previousSubCategory?.category.slug, nextCategory?.slug].filter(Boolean) as string[],
  );

  revalidatePath("/admin/subcategories");
  redirect("/admin/subcategories");
}

export async function deleteSubCategoryAction(formData: FormData) {
  await requirePermission("manage_taxonomy");
  const id = String(formData.get("id") || "");
  if (id) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      select: { category: { select: { slug: true } } },
    });

    await prisma.subCategory.delete({ where: { id } });

    refreshCategoryCaches(subCategory?.category.slug ? [subCategory.category.slug] : []);
  }
  revalidatePath("/admin/subcategories");
  redirect("/admin/subcategories");
}

export async function saveTagAction(formData: FormData) {
  await requirePermission("manage_taxonomy");
  const parsed = simpleNameSchema.parse({
    id: optionalString(formData.get("id")),
    name: formData.get("name"),
    slug: optionalString(formData.get("slug")),
    description: optionalString(formData.get("description")),
  });

  const previousTag = parsed.id
    ? await prisma.tag.findUnique({
        where: { id: parsed.id },
        select: { slug: true },
      })
    : null;

  const slug = await ensureUniqueSlug("tag", parsed.slug || parsed.name, parsed.id);

  await prisma.tag.upsert({
    where: { id: parsed.id || "new-tag" },
    update: {
      name: parsed.name,
      slug,
      description: parsed.description,
    },
    create: {
      name: parsed.name,
      slug,
      description: parsed.description,
    },
  });

  refreshTagCaches([previousTag?.slug, slug].filter(Boolean) as string[]);

  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function deleteTagAction(formData: FormData) {
  await requirePermission("manage_taxonomy");
  const id = String(formData.get("id") || "");
  if (id) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      select: { slug: true },
    });

    await prisma.tag.delete({ where: { id } });

    refreshTagCaches(tag?.slug ? [tag.slug] : []);
  }
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function saveAuthorAction(formData: FormData) {
  await requirePermission("manage_articles");
  const parsed = z
    .object({
      id: z.string().optional(),
      displayName: z.string().trim().min(2),
      slug: z.string().trim().optional(),
      bio: z.string().trim().min(20),
      title: z.string().trim().optional(),
      shortBio: z.string().trim().optional(),
      twitterUrl: z.string().url().optional().or(z.literal("")),
      userId: z.string().optional().or(z.literal("")),
      avatarId: z.string().optional().or(z.literal("")),
    })
    .parse({
      id: optionalString(formData.get("id")),
      displayName: formData.get("displayName"),
      slug: optionalString(formData.get("slug")),
      bio: formData.get("bio"),
      title: optionalString(formData.get("title")),
      shortBio: optionalString(formData.get("shortBio")),
      twitterUrl: optionalString(formData.get("twitterUrl")) || "",
      userId: optionalString(formData.get("userId")) || "",
      avatarId: optionalString(formData.get("avatarId")) || "",
    });

  const previousAuthor = parsed.id
    ? await prisma.authorProfile.findUnique({
        where: { id: parsed.id },
        select: { slug: true },
      })
    : null;

  const slug = await ensureUniqueSlug("authorProfile", parsed.slug || parsed.displayName, parsed.id);

  await prisma.authorProfile.upsert({
    where: { id: parsed.id || "new-author" },
    update: {
      displayName: parsed.displayName,
      slug,
      bio: parsed.bio,
      title: parsed.title,
      shortBio: parsed.shortBio,
      twitterUrl: parsed.twitterUrl || undefined,
      userId: parsed.userId || undefined,
      avatarId: parsed.avatarId || undefined,
    },
    create: {
      displayName: parsed.displayName,
      slug,
      bio: parsed.bio,
      title: parsed.title,
      shortBio: parsed.shortBio,
      twitterUrl: parsed.twitterUrl || undefined,
      userId: parsed.userId || undefined,
      avatarId: parsed.avatarId || undefined,
    },
  });

  refreshAuthorCaches([previousAuthor?.slug, slug].filter(Boolean) as string[]);

  revalidatePath("/admin/authors");
  redirect("/admin/authors");
}

export async function deleteAuthorAction(formData: FormData) {
  await requirePermission("manage_articles");
  const id = String(formData.get("id") || "");
  if (id) {
    const author = await prisma.authorProfile.findUnique({
      where: { id },
      select: { slug: true },
    });

    await prisma.authorProfile.delete({ where: { id } });

    refreshAuthorCaches(author?.slug ? [author.slug] : []);
  }
  revalidatePath("/admin/authors");
  redirect("/admin/authors");
}

export async function moderateCommentAction(formData: FormData) {
  await requirePermission("manage_comments");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PENDING") as "APPROVED" | "REJECTED" | "SPAM";

  if (id) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { article: { select: { slug: true } } },
    });

    await prisma.comment.update({
      where: { id },
      data: {
        status,
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
    });

    refreshArticleCaches({ slug: comment?.article.slug });
  }

  revalidatePath("/admin/comments");
  revalidatePath("/");
  redirect("/admin/comments");
}

export async function deleteCommentAction(formData: FormData) {
  await requirePermission("manage_comments");
  const id = String(formData.get("id") || "");
  if (id) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { article: { select: { slug: true } } },
    });

    await prisma.comment.delete({ where: { id } });

    refreshArticleCaches({ slug: comment?.article.slug });
  }
  revalidatePath("/admin/comments");
  redirect("/admin/comments");
}

export async function saveRedirectAction(formData: FormData) {
  await requirePermission("manage_redirects");
  const parsed = z
    .object({
      id: z.string().optional(),
      sourcePath: z.string().trim().min(1),
      destinationPath: z.string().trim().min(1),
      statusCode: z.coerce.number().int().min(301).max(308),
      notes: z.string().trim().optional(),
      active: z.boolean(),
    })
    .parse({
      id: optionalString(formData.get("id")),
      sourcePath: formData.get("sourcePath"),
      destinationPath: formData.get("destinationPath"),
      statusCode: Number(formData.get("statusCode") || 301),
      notes: optionalString(formData.get("notes")),
      active: booleanFromForm(formData.get("active")),
    });

  await prisma.redirect.upsert({
    where: { id: parsed.id || "new-redirect" },
    update: parsed,
    create: parsed,
  });

  refreshRedirectCaches();

  revalidatePath("/admin/redirects");
  redirect("/admin/redirects");
}

export async function deleteRedirectAction(formData: FormData) {
  await requirePermission("manage_redirects");
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.redirect.delete({ where: { id } });
  }
  refreshRedirectCaches();
  revalidatePath("/admin/redirects");
  redirect("/admin/redirects");
}

export async function saveAdSlotAction(formData: FormData) {
  await requirePermission("manage_ads");
  const parsed = z
    .object({
      id: z.string().optional(),
      key: z.string().trim().min(2),
      name: z.string().trim().min(2),
      placement: z.enum(["HEADER", "SIDEBAR", "IN_ARTICLE", "FOOTER", "HOMEPAGE", "INLINE", "SPONSORED"]),
      description: z.string().trim().optional(),
      sponsorLabel: z.string().trim().optional(),
      advertiserName: z.string().trim().optional(),
      ctaLabel: z.string().trim().optional(),
      codeHtml: z.string().trim().optional(),
      imageUrl: z.string().url().optional().or(z.literal("")),
      targetUrl: z.string().url().optional().or(z.literal("")),
      positionKey: z.string().trim().optional(),
      injectAfterParagraph: z.coerce.number().int().min(1).max(20).optional(),
      displayOrder: z.coerce.number().int().min(0).default(0),
      enabled: z.boolean(),
    })
    .parse({
      id: optionalString(formData.get("id")),
      key: formData.get("key"),
      name: formData.get("name"),
      placement: formData.get("placement"),
      description: optionalString(formData.get("description")),
      sponsorLabel: optionalString(formData.get("sponsorLabel")),
      advertiserName: optionalString(formData.get("advertiserName")),
      ctaLabel: optionalString(formData.get("ctaLabel")),
      codeHtml: optionalString(formData.get("codeHtml")),
      imageUrl: optionalString(formData.get("imageUrl")) || "",
      targetUrl: optionalString(formData.get("targetUrl")) || "",
      positionKey: optionalString(formData.get("positionKey")),
      injectAfterParagraph: optionalString(formData.get("injectAfterParagraph"))
        ? Number(formData.get("injectAfterParagraph"))
        : undefined,
      displayOrder: Number(formData.get("displayOrder") || 0),
      enabled: booleanFromForm(formData.get("enabled")),
    });

  const previousSlot = parsed.id
    ? await prisma.adSlot.findUnique({
        where: { id: parsed.id },
        select: { key: true, placement: true, positionKey: true },
      })
    : null;

  await prisma.adSlot.upsert({
    where: { id: parsed.id || "new-adslot" },
    update: {
      key: parsed.key,
      name: parsed.name,
      placement: parsed.placement,
      description: parsed.description,
      sponsorLabel: parsed.sponsorLabel,
      advertiserName: parsed.advertiserName,
      ctaLabel: parsed.ctaLabel,
      codeHtml: parsed.codeHtml,
      imageUrl: parsed.imageUrl || undefined,
      targetUrl: parsed.targetUrl || undefined,
      positionKey: parsed.positionKey,
      injectAfterParagraph: parsed.injectAfterParagraph,
      displayOrder: parsed.displayOrder,
      enabled: parsed.enabled,
    },
    create: {
      key: parsed.key,
      name: parsed.name,
      placement: parsed.placement,
      description: parsed.description,
      sponsorLabel: parsed.sponsorLabel,
      advertiserName: parsed.advertiserName,
      ctaLabel: parsed.ctaLabel,
      codeHtml: parsed.codeHtml,
      imageUrl: parsed.imageUrl || undefined,
      targetUrl: parsed.targetUrl || undefined,
      positionKey: parsed.positionKey,
      injectAfterParagraph: parsed.injectAfterParagraph,
      displayOrder: parsed.displayOrder,
      enabled: parsed.enabled,
    },
  });

  refreshAdCaches(previousSlot || undefined);
  refreshAdCaches({
    key: parsed.key,
    placement: parsed.placement,
    positionKey: parsed.positionKey,
  });

  revalidatePath("/admin/ads");
  redirect("/admin/ads");
}

export async function deleteAdSlotAction(formData: FormData) {
  await requirePermission("manage_ads");
  const id = String(formData.get("id") || "");
  if (id) {
    const slot = await prisma.adSlot.findUnique({
      where: { id },
      select: { key: true, placement: true, positionKey: true },
    });

    await prisma.adSlot.delete({ where: { id } });

    refreshAdCaches(slot || undefined);
  }
  revalidatePath("/admin/ads");
  redirect("/admin/ads");
}

export async function saveSettingAction(formData: FormData) {
  await requirePermission("manage_settings");
  const parsed = z
    .object({
      id: z.string().optional(),
      key: z.string().trim().min(2),
      group: z.string().trim().min(2),
      label: z.string().trim().min(2),
      description: z.string().trim().optional(),
      value: z.string().trim().min(2),
    })
    .parse({
      id: optionalString(formData.get("id")),
      key: formData.get("key"),
      group: formData.get("group"),
      label: formData.get("label"),
      description: optionalString(formData.get("description")),
      value: formData.get("value"),
    });

  const parsedValue = JSON.parse(parsed.value);

  await prisma.siteSetting.upsert({
    where: { key: parsed.key },
    update: {
      group: parsed.group,
      label: parsed.label,
      description: parsed.description,
      value: parsedValue,
    },
    create: {
      key: parsed.key,
      group: parsed.group,
      label: parsed.label,
      description: parsed.description,
      value: parsedValue,
    },
  });

  refreshHomepageCaches();

  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}

export async function saveUserAction(formData: FormData) {
  await requirePermission("manage_users");
  const parsed = z
    .object({
      id: z.string().optional(),
      name: z.string().trim().min(2),
      email: z.string().email(),
      roleId: z.string().min(1),
      password: z.string().trim().optional(),
      status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]),
    })
    .parse({
      id: optionalString(formData.get("id")),
      name: formData.get("name"),
      email: formData.get("email"),
      roleId: formData.get("roleId"),
      password: optionalString(formData.get("password")),
      status: formData.get("status"),
    });

  const passwordHash = parsed.password
    ? await import("bcryptjs").then(({ default: bcrypt }) => bcrypt.hash(parsed.password!, 12))
    : undefined;

  await prisma.user.upsert({
    where: { id: parsed.id || "new-user" },
    update: {
      name: parsed.name,
      email: parsed.email,
      roleId: parsed.roleId,
      status: parsed.status,
      ...(passwordHash ? { passwordHash } : {}),
    },
    create: {
      name: parsed.name,
      email: parsed.email,
      roleId: parsed.roleId,
      status: parsed.status,
      passwordHash: passwordHash || (await import("bcryptjs").then(({ default: bcrypt }) => bcrypt.hash("Newsroom123!", 12))),
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  await requirePermission("manage_users");
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.user.delete({ where: { id } });
  }
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteSubscriberAction(formData: FormData) {
  await requirePermission("manage_subscribers");
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.subscriber.delete({ where: { id } });
  }
  revalidatePath("/admin/subscribers");
  redirect("/admin/subscribers");
}

export async function deleteMediaAction(formData: FormData) {
  await requirePermission("manage_media");
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.media.delete({ where: { id } });
  }
  refreshArticleCaches();
  refreshPageCaches();
  refreshHomepageCaches();
  refreshAdCaches();
  revalidatePath("/admin/media");
  redirect("/admin/media");
}
