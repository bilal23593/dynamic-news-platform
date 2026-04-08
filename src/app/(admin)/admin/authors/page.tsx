import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getSearchParam } from "@/lib/utils";
import { deleteAuthorAction, saveAuthorAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";

type Props = { searchParams: SearchParams };

export default async function AuthorsPage({ searchParams }: Props) {
  await requirePermission("manage_articles");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);

  const [authors, users, media] = await Promise.all([
    prisma.authorProfile.findMany({
      orderBy: { displayName: "asc" },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const selected = authors.find((item) => item.id === editId);

  return (
    <AdminShell title="Authors" description="Manage bylines, bios, optional user links, and avatar assets.">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{selected ? "Edit Author" : "New Author"}</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <form action={saveAuthorAction} className="grid gap-4">
              <input type="hidden" name="id" value={selected?.id || ""} />
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" name="displayName" defaultValue={selected?.displayName} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={selected?.slug} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={selected?.title || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shortBio">Short bio</Label>
                <Input id="shortBio" name="shortBio" defaultValue={selected?.shortBio || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Full bio</Label>
                <Textarea id="bio" name="bio" defaultValue={selected?.bio || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twitterUrl">X / Twitter URL</Label>
                <Input id="twitterUrl" name="twitterUrl" defaultValue={selected?.twitterUrl || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="userId">Linked user</Label>
                <select id="userId" name="userId" defaultValue={selected?.userId || ""} className="h-11 w-full min-w-0 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                  <option value="">No linked user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="avatarId">Avatar media</Label>
                <select id="avatarId" name="avatarId" defaultValue={selected?.avatarId || ""} className="h-11 w-full min-w-0 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                  <option value="">No avatar</option>
                  {media.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fileName}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton>{selected ? "Update author" : "Create author"}</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Author Directory</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stories</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authors.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell>
                      <div className="font-semibold">{author.displayName}</div>
                      <div className="text-xs text-muted-foreground">{author.title}</div>
                    </TableCell>
                    <TableCell>{author._count.articles}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/authors?edit=${author.id}`}>Edit</a>
                      </Button>
                      <form action={deleteAuthorAction}>
                        <input type="hidden" name="id" value={author.id} />
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
