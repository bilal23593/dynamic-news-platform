import { AdminShell } from "@/components/layout/admin-shell";
import { MediaUploadForm } from "@/components/forms/media-upload-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteMediaAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export default async function MediaPage() {
  await requirePermission("manage_media");
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <AdminShell title="Media Library" description="Upload images and reusable assets through the local media abstraction layer.">
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaUploadForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold">{item.fileName}</div>
                      <div className="text-xs text-muted-foreground">{item.url}</div>
                    </TableCell>
                    <TableCell>{item.storageProvider}</TableCell>
                    <TableCell>{Math.round(item.bytes / 1024)} KB</TableCell>
                    <TableCell>
                      <form action={deleteMediaAction}>
                        <input type="hidden" name="id" value={item.id} />
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

