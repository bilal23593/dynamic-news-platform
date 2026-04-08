import { AdminShell } from "@/components/layout/admin-shell";
import { ImportManagerForm } from "@/components/forms/import-manager-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export default async function ImportsPage() {
  await requirePermission("manage_imports");
  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <AdminShell title="Imports" description="Dry-run WordPress payloads, map legacy content, and finalize migration batches when ready.">
      <ImportManagerForm />
      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Latest log</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.title}</TableCell>
                    <TableCell>{batch.status}</TableCell>
                    <TableCell>{batch.sourceType}</TableCell>
                    <TableCell>{batch.logs[0]?.message || "No logs yet"}</TableCell>
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
