import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleEditorForm } from "@/features/admin/components/article-editor-form";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export default async function NewArticlePage() {
  await requirePermission("manage_articles");

  const [categories, subcategories, authors, tags, media, relatedArticles] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.authorProfile.findMany({ orderBy: { displayName: "asc" } }),
    prisma.tag.findMany({ orderBy: [{ updatedAt: "desc" }, { name: "asc" }], take: 24 }),
    prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.article.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED", "PUBLISHED"] } },
      orderBy: { updatedAt: "desc" },
      take: 24,
      include: { category: true, subCategory: true },
    }),
  ]);

  return (
    <AdminShell title="New Article" description="Create a newsroom story with structured metadata, taxonomy, and editorial controls.">
      <Card>
        <CardHeader>
          <CardTitle>Story Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleEditorForm
            categories={categories.map((item) => ({ id: item.id, label: item.name }))}
            subcategories={subcategories.map((item) => ({ id: item.id, label: item.name, categoryId: item.categoryId }))}
            authors={authors.map((item) => ({ id: item.id, label: item.displayName }))}
            tagSeedOptions={tags.map((item) => ({
              id: item.id,
              label: item.name,
              description: item.description || item.slug,
            }))}
            media={media.map((item) => ({ id: item.id, label: item.fileName }))}
            relatedArticleSeedOptions={relatedArticles.map((item) => ({
              id: item.id,
              label: item.title,
              description: [item.status, item.category.name, item.subCategory?.name].filter(Boolean).join(" · "),
            }))}
          />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
