import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export default async function AdminDashboardPage() {
  await requirePermission("manage_articles");

  const [articleCount, pendingComments, subscriberCount, mediaCount, recentArticles] = await Promise.all([
    prisma.article.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.media.count(),
    prisma.article.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        author: true,
        category: true,
      },
    }),
  ]);

  return (
    <AdminShell
      title="Dashboard"
      description="Track publishing velocity, moderation workload, and the live state of the newsroom from one place."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Stories", value: articleCount, detail: "Across all statuses" },
          { label: "Pending comments", value: pendingComments, detail: "Needs moderation" },
          { label: "Subscribers", value: subscriberCount, detail: "Active newsletter members" },
          { label: "Media items", value: mediaCount, detail: "Library assets" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
              <CardTitle className="text-4xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.detail}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Article Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Headline</TableHead>
                  <TableHead>Desk</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <a href={`/admin/articles/${article.id}/edit`} className="font-semibold hover:text-primary">
                        {article.title}
                      </a>
                      <div className="text-xs text-muted-foreground">{article.author.displayName}</div>
                    </TableCell>
                    <TableCell>{article.category.name}</TableCell>
                    <TableCell>
                      <Badge variant={article.status === "PUBLISHED" ? "success" : "secondary"}>
                        {article.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { href: "/admin/articles/new", label: "Create article" },
              { href: "/admin/homepage", label: "Manage homepage" },
              { href: "/admin/comments", label: "Moderate comments" },
              { href: "/admin/imports", label: "Run WordPress dry run" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
