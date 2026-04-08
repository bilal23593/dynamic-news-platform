import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageEditorForm } from "@/features/admin/components/page-editor-form";
import { getSearchParam } from "@/lib/utils";
import { deletePageAction } from "@/server/cms/editor-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";

type Props = { searchParams: SearchParams };

export default async function PagesPage({ searchParams }: Props) {
  await requirePermission("manage_pages");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);

  const [pages, media] = await Promise.all([
    prisma.page.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
  ]);
  const selected = pages.find((item) => item.id === editId);

  return (
    <AdminShell title="Pages" description="Manage static and policy pages through the same editor used for stories.">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit Page" : "Create Page"}</CardTitle>
          </CardHeader>
          <CardContent>
            <PageEditorForm
              page={
                selected
                  ? {
                      id: selected.id,
                      title: selected.title,
                      slug: selected.slug,
                      summary: selected.summary,
                      contentHtml: selected.contentHtml,
                      contentJson: JSON.stringify(selected.contentJson || {}),
                      status: selected.status,
                      seoTitle: selected.seoTitle,
                      metaDescription: selected.metaDescription,
                      canonicalUrl: selected.canonicalUrl,
                      schemaType: selected.schemaType,
                      ogImageId: selected.ogImageId,
                      showInHeader: selected.showInHeader,
                      showInFooter: selected.showInFooter,
                    }
                  : undefined
              }
              media={media.map((item) => ({ id: item.id, label: item.fileName }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Published & Draft Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Header</TableHead>
                  <TableHead>Footer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="font-semibold">{page.title}</div>
                      <div className="text-xs text-muted-foreground">/{page.slug}</div>
                    </TableCell>
                    <TableCell>{page.status}</TableCell>
                    <TableCell>{page.showInHeader ? "Yes" : "No"}</TableCell>
                    <TableCell>{page.showInFooter ? "Yes" : "No"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/pages?edit=${page.id}`}>Edit</a>
                      </Button>
                      <form action={deletePageAction}>
                        <input type="hidden" name="id" value={page.id} />
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
      </div>
    </AdminShell>
  );
}
