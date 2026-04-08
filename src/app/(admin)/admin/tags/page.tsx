import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getSearchParam } from "@/lib/utils";
import { deleteTagAction, saveTagAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";

type Props = { searchParams: SearchParams };

export default async function TagsPage({ searchParams }: Props) {
  await requirePermission("manage_taxonomy");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { articleTags: true },
      },
    },
  });
  const selected = tags.find((item) => item.id === editId);

  return (
    <AdminShell title="Tags" description="Maintain topical tagging for search, discovery, and related-story clustering.">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit Tag" : "New Tag"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveTagAction} className="grid gap-4">
              <input type="hidden" name="id" value={selected?.id || ""} />
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={selected?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={selected?.slug} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selected?.description || ""} />
              </div>
              <SubmitButton>{selected ? "Update tag" : "Create tag"}</SubmitButton>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>All Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stories</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <div className="font-semibold">{tag.name}</div>
                      <div className="text-xs text-muted-foreground">/{tag.slug}</div>
                    </TableCell>
                    <TableCell>{tag._count.articleTags}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/tags?edit=${tag.id}`}>Edit</a>
                      </Button>
                      <form action={deleteTagAction}>
                        <input type="hidden" name="id" value={tag.id} />
                        <Button variant="destructive" size="sm">
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
