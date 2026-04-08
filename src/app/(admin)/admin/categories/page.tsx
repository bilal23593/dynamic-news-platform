import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getSearchParam } from "@/lib/utils";
import { deleteCategoryAction, saveCategoryAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";

type Props = { searchParams: SearchParams };

export default async function CategoriesPage({ searchParams }: Props) {
  await requirePermission("manage_taxonomy");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      subcategories: true,
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  const selected = categories.find((item) => item.id === editId);

  return (
    <AdminShell title="Categories" description="Control primary desks, their slugs, labels, and homepage order.">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit Category" : "New Category"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveCategoryAction} className="grid gap-4">
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
                <Label htmlFor="label">Label</Label>
                <Input id="label" name="label" defaultValue={selected?.label || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" defaultValue={selected?.color || ""} placeholder="#b30d16" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={selected?.sortOrder ?? 0} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selected?.description || ""} />
              </div>
              <SubmitButton>{selected ? "Update category" : "Create category"}</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subcats</TableHead>
                  <TableHead>Stories</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="font-semibold">{category.name}</div>
                      <div className="text-xs text-muted-foreground">/{category.slug}</div>
                    </TableCell>
                    <TableCell>{category.subcategories.length}</TableCell>
                    <TableCell>{category._count.articles}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/categories?edit=${category.id}`}>Edit</a>
                      </Button>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={category.id} />
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
