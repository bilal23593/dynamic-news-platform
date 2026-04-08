import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getSearchParam } from "@/lib/utils";
import { deleteRedirectAction, saveRedirectAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";

type Props = { searchParams: SearchParams };

export default async function RedirectsPage({ searchParams }: Props) {
  await requirePermission("manage_redirects");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);
  const redirects = await prisma.redirect.findMany({ orderBy: { updatedAt: "desc" } });
  const selected = redirects.find((item) => item.id === editId);

  return (
    <AdminShell title="Redirects" description="Manage legacy paths and migration redirects without touching server config.">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit Redirect" : "New Redirect"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveRedirectAction} className="grid gap-4">
              <input type="hidden" name="id" value={selected?.id || ""} />
              <div className="grid gap-2">
                <Label htmlFor="sourcePath">Source path</Label>
                <Input id="sourcePath" name="sourcePath" defaultValue={selected?.sourcePath} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destinationPath">Destination path</Label>
                <Input id="destinationPath" name="destinationPath" defaultValue={selected?.destinationPath} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="statusCode">Status code</Label>
                <Input id="statusCode" name="statusCode" type="number" defaultValue={selected?.statusCode || 301} />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="active" defaultChecked={selected?.active ?? true} />
                Active
              </label>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={selected?.notes || ""} />
              </div>
              <SubmitButton>{selected ? "Update redirect" : "Create redirect"}</SubmitButton>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Redirect Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redirects.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.sourcePath}</TableCell>
                    <TableCell>{item.destinationPath}</TableCell>
                    <TableCell>{item.statusCode}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/redirects?edit=${item.id}`}>Edit</a>
                      </Button>
                      <form action={deleteRedirectAction}>
                        <input type="hidden" name="id" value={item.id} />
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
