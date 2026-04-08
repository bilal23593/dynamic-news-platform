import Link from "next/link";

import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteArticleAction } from "@/server/cms/editor-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export default async function ArticlesPage() {
  await requirePermission("manage_articles");
  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: true,
      category: true,
    },
    take: 80,
  });

  return (
    <AdminShell title="Articles" description="Manage drafts, scheduled stories, and published coverage from a single newsroom queue.">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Story Queue</CardTitle>
          <Button asChild>
            <Link href="/admin/articles/new">Create article</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Headline</TableHead>
                <TableHead>Desk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                  <TableCell>
                    <div className="font-semibold">{article.title}</div>
                    <div className="text-xs text-muted-foreground">{article.author.displayName}</div>
                  </TableCell>
                  <TableCell>{article.category.name}</TableCell>
                  <TableCell>{article.status}</TableCell>
                  <TableCell>{article.updatedAt.toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={`/admin/articles/${article.id}/edit`}>Edit</a>
                    </Button>
                    <form action={deleteArticleAction}>
                      <input type="hidden" name="id" value={article.id} />
                      <Button size="sm" variant="destructive">
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
