import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSearchParam } from "@/lib/utils";
import { deleteUserAction, saveUserAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";

type Props = { searchParams: SearchParams };

export default async function UsersPage({ searchParams }: Props) {
  await requirePermission("manage_users");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);

  const [roles, users] = await Promise.all([
    prisma.role.findMany({ orderBy: { label: "asc" } }),
    prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const selected = users.find((item) => item.id === editId);

  return (
    <AdminShell title="Users & Roles" description="Manage newsroom users and assign their permission scope through roles.">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit User" : "New User"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveUserAction} className="grid gap-4">
              <input type="hidden" name="id" value={selected?.id || ""} />
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={selected?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={selected?.email} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="roleId">Role</Label>
                <select id="roleId" name="roleId" defaultValue={selected?.roleId || roles[0]?.id} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue={selected?.status || "ACTIVE"} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                  {["ACTIVE", "INVITED", "SUSPENDED"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder={selected ? "Leave blank to keep current" : "Set an initial password"} />
              </div>
              <SubmitButton>{selected ? "Update user" : "Create user"}</SubmitButton>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>{user.role.label}</TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/users?edit=${user.id}`}>Edit</a>
                      </Button>
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={user.id} />
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
