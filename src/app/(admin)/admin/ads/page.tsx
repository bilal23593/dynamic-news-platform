import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { hasConfiguredAdCreative } from "@/lib/ads";
import { getSearchParam } from "@/lib/utils";
import { deleteAdSlotAction, saveAdSlotAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";
import type { SearchParams } from "@/types";

type Props = { searchParams: SearchParams };

export default async function AdsPage({ searchParams }: Props) {
  await requirePermission("manage_ads");
  const params = await searchParams;
  const editId = getSearchParam(params.edit);
  const slots = await prisma.adSlot.findMany({ orderBy: [{ placement: "asc" }, { displayOrder: "asc" }, { updatedAt: "desc" }] });
  const selected = slots.find((item) => item.id === editId);

  return (
    <AdminShell title="Ads" description="Manage inventory and sponsor blocks. Enabled ad tags can stay active all the time. Public placements stay collapsed until a real creative renders, so empty or no-fill responses do not leave dead space.">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{selected ? "Edit Ad Slot" : "New Ad Slot"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveAdSlotAction} className="grid gap-4">
              <input type="hidden" name="id" value={selected?.id || ""} />
              <div className="grid gap-2">
                <Label htmlFor="key">Key</Label>
                <Input id="key" name="key" defaultValue={selected?.key} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={selected?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="placement">Placement</Label>
                <select id="placement" name="placement" defaultValue={selected?.placement} className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3">
                  {["HEADER", "SIDEBAR", "IN_ARTICLE", "FOOTER", "HOMEPAGE", "INLINE", "SPONSORED"].map((placement) => (
                    <option key={placement} value={placement}>
                      {placement}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selected?.description || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sponsorLabel">Sponsor label</Label>
                <Input id="sponsorLabel" name="sponsorLabel" defaultValue={selected?.sponsorLabel || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="advertiserName">Advertiser</Label>
                <Input id="advertiserName" name="advertiserName" defaultValue={selected?.advertiserName || ""} placeholder="Acme Bank" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="ctaLabel">CTA label</Label>
                  <Input id="ctaLabel" name="ctaLabel" defaultValue={selected?.ctaLabel || ""} placeholder="Learn more" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetUrl">Target URL</Label>
                  <Input id="targetUrl" name="targetUrl" defaultValue={selected?.targetUrl || ""} placeholder="https://advertiser.example" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="positionKey">Position key</Label>
                  <Input
                    id="positionKey"
                    name="positionKey"
                    defaultValue={selected?.positionKey || ""}
                    placeholder="article-body, article-sidebar-top, homepage-after-hero"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayOrder">Display order</Label>
                  <Input id="displayOrder" name="displayOrder" type="number" defaultValue={selected?.displayOrder ?? 0} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="injectAfterParagraph">Inject after paragraph</Label>
                  <Input
                    id="injectAfterParagraph"
                    name="injectAfterParagraph"
                    type="number"
                    defaultValue={selected?.injectAfterParagraph ?? ""}
                    placeholder="2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Fallback image URL</Label>
                  <Input id="imageUrl" name="imageUrl" defaultValue={selected?.imageUrl || ""} placeholder="https://..." />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="codeHtml">Code / HTML</Label>
                <Textarea id="codeHtml" name="codeHtml" defaultValue={selected?.codeHtml || ""} className="min-h-[180px] font-mono text-xs" />
                <p className="text-xs text-muted-foreground">
                  Paste an ad network tag or sponsored creative. The slot stays collapsed until visible content actually renders.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="enabled" defaultChecked={selected?.enabled ?? true} />
                Enabled
              </label>
              <SubmitButton>{selected ? "Update slot" : "Create slot"}</SubmitButton>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ad Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Creative</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell>
                      <div className="font-semibold">{slot.name}</div>
                      <div className="text-xs text-muted-foreground">{slot.key}</div>
                    </TableCell>
                    <TableCell>{slot.placement}</TableCell>
                    <TableCell>{slot.positionKey || "default"}</TableCell>
                    <TableCell>{slot.injectAfterParagraph ? `P${slot.injectAfterParagraph} / ${slot.displayOrder}` : slot.displayOrder}</TableCell>
                    <TableCell>
                      {hasConfiguredAdCreative(slot) ? "Configured" : "Awaiting creative"}
                    </TableCell>
                    <TableCell>{slot.enabled ? "Yes" : "No"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`/admin/ads?edit=${slot.id}`}>Edit</a>
                      </Button>
                      <form action={deleteAdSlotAction}>
                        <input type="hidden" name="id" value={slot.id} />
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
