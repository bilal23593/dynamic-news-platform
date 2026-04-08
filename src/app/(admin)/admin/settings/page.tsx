import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { saveSettingAction } from "@/server/cms/admin-actions";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export default async function SettingsPage() {
  await requirePermission("manage_settings");
  const settings = await prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });

  return (
    <AdminShell title="Settings" description="Store structured site settings for SEO, footer, contact, and newsletter modules.">
      <div className="grid gap-6">
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <CardTitle>{setting.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveSettingAction} className="grid gap-4">
                <input type="hidden" name="id" value={setting.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`key-${setting.id}`}>Key</Label>
                    <Input id={`key-${setting.id}`} name="key" defaultValue={setting.key} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`group-${setting.id}`}>Group</Label>
                    <Input id={`group-${setting.id}`} name="group" defaultValue={setting.group} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`label-${setting.id}`}>Label</Label>
                  <Input id={`label-${setting.id}`} name="label" defaultValue={setting.label} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`description-${setting.id}`}>Description</Label>
                  <Input id={`description-${setting.id}`} name="description" defaultValue={setting.description || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`value-${setting.id}`}>JSON value</Label>
                  <Textarea
                    id={`value-${setting.id}`}
                    name="value"
                    defaultValue={JSON.stringify(setting.value, null, 2)}
                    className="min-h-[180px] font-mono text-xs"
                  />
                </div>
                <SubmitButton className="w-fit">Save setting</SubmitButton>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

