import { notFound } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleEditorForm } from "@/features/admin/components/article-editor-form";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: Props) {
  await requirePermission("manage_articles");
  const { id } = await params;

  const [article, categories, subcategories, authors, tags, media, relatedArticles, articleTags, related] =
    await Promise.all([
      prisma.article.findUnique({ where: { id } }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.subCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.authorProfile.findMany({ orderBy: { displayName: "asc" } }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
      prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.article.findMany({ where: { id: { not: id } }, orderBy: { updatedAt: "desc" }, take: 80 }),
      prisma.articleTag.findMany({ where: { articleId: id } }),
      prisma.articleRelation.findMany({ where: { sourceArticleId: id } }),
    ]);

  if (!article) notFound();

  return (
    <AdminShell title="Edit Article" description="Update story copy, publishing status, taxonomy, and search metadata.">
      <Card>
        <CardHeader>
          <CardTitle>Story Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleEditorForm
            article={{
              id: article.id,
              title: article.title,
              slug: article.slug,
              subtitle: article.subtitle,
              excerpt: article.excerpt,
              contentHtml: article.contentHtml,
              contentJson: JSON.stringify(article.contentJson || {}),
              categoryId: article.categoryId,
              subCategoryId: article.subCategoryId,
              authorId: article.authorId,
              status: article.status,
              publishAt: article.publishAt.toISOString().slice(0, 16),
              featuredImageId: article.featuredImageId,
              ogImageId: article.ogImageId,
              imageCaption: article.imageCaption,
              videoEmbedUrl: article.videoEmbedUrl,
              seoTitle: article.seoTitle,
              metaDescription: article.metaDescription,
              canonicalUrl: article.canonicalUrl,
              schemaType: article.schemaType,
              allowComments: article.allowComments,
              breakingNews: article.breakingNews,
              trending: article.trending,
              featured: article.featured,
              popular: article.popular,
              selectedTagIds: articleTags.map((item) => item.tagId),
              selectedRelatedIds: related.map((item) => item.targetArticleId),
            }}
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

