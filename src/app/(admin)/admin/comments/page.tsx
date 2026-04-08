import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCommentAction, moderateCommentAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export default async function CommentsPage() {
  await requirePermission("manage_comments");
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      article: true,
    },
    take: 60,
  });

  return (
    <AdminShell title="Comments" description="Approve, reject, or remove reader comments from across the site.">
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Story</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <div className="font-semibold">{comment.authorName}</div>
                    <div className="max-w-xl text-sm text-muted-foreground">{comment.content}</div>
                  </TableCell>
                  <TableCell>{comment.status}</TableCell>
                  <TableCell>{comment.article.title}</TableCell>
                  <TableCell className="flex flex-wrap gap-2">
                    <form action={moderateCommentAction}>
                      <input type="hidden" name="id" value={comment.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <Button size="sm">Approve</Button>
                    </form>
                    <form action={moderateCommentAction}>
                      <input type="hidden" name="id" value={comment.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <Button size="sm" variant="outline">
                        Reject
                      </Button>
                    </form>
                    <form action={moderateCommentAction}>
                      <input type="hidden" name="id" value={comment.id} />
                      <input type="hidden" name="status" value="SPAM" />
                      <Button size="sm" variant="outline">
                        Spam
                      </Button>
                    </form>
                    <form action={deleteCommentAction}>
                      <input type="hidden" name="id" value={comment.id} />
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

