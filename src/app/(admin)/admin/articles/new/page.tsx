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
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.article.findMany({ orderBy: { updatedAt: "desc" }, take: 80 }),
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
            tags={tags.map((item) => ({ id: item.id, label: item.name }))}
            media={media.map((item) => ({ id: item.id, label: item.fileName }))}
            relatedArticles={relatedArticles.map((item) => ({ id: item.id, label: item.title }))}
          />
        </CardContent>
      </Card>
    </AdminShell>
  );
}

