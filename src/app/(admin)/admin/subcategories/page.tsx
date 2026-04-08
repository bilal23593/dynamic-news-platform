import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getSearchParam } from "@/lib/utils";
import { deleteSubCategoryAction, saveSubCategoryAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";

type Props = { searchParams: SearchParams };

export default async function SubcategoriesPage({ searchParams }: Props) {
  await requirePermission("manage_taxonomy");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);

  const [categories, subcategories] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subCategory.findMany({
      orderBy: [{ category: { name: "asc" } }, { sortOrder: "asc" }],
      include: {
        category: true,
        _count: {
          select: { articles: true },
        },
      },
    }),
  ]);
  const selected = subcategories.find((item) => item.id === editId);

  return (
    <AdminShell title="Subcategories" description="Nest desks under parent categories for richer navigation and filtering.">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit Subcategory" : "New Subcategory"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSubCategoryAction} className="grid gap-4">
              <input type="hidden" name="id" value={selected?.id || ""} />
              <div className="grid gap-2">
                <Label htmlFor="categoryId">Parent category</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={selected?.categoryId}
                  className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={selected?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={selected?.slug} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={selected?.sortOrder ?? 0} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selected?.description || ""} />
              </div>
              <SubmitButton>{selected ? "Update subcategory" : "Create subcategory"}</SubmitButton>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>All Subcategories</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Stories</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell>
                      <div className="font-semibold">{subcategory.name}</div>
                      <div className="text-xs text-muted-foreground">/{subcategory.slug}</div>
                    </TableCell>
                    <TableCell>{subcategory.category.name}</TableCell>
                    <TableCell>{subcategory._count.articles}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/subcategories?edit=${subcategory.id}`}>Edit</a>
                      </Button>
                      <form action={deleteSubCategoryAction}>
                        <input type="hidden" name="id" value={subcategory.id} />
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
