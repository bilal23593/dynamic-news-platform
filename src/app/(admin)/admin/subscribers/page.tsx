import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteSubscriberAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export default async function SubscribersPage() {
  await requirePermission("manage_subscribers");
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AdminShell title="Subscribers" description="Review newsletter growth and clean up unwanted or bounced records.">
      <Card>
        <CardHeader>
          <CardTitle>Email Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>First name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell>{subscriber.email}</TableCell>
                  <TableCell>{subscriber.firstName || "—"}</TableCell>
                  <TableCell>{subscriber.status}</TableCell>
                  <TableCell>
                    <form action={deleteSubscriberAction}>
                      <input type="hidden" name="id" value={subscriber.id} />
                      <Button size="sm" variant="destructive">
                        Remove
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
