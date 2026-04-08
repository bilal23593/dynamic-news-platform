import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireUser } from "@/server/auth/session";

export async function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-[#f1f1f1] lg:flex">
      <AdminSidebar roleName={user.role.name} userName={user.name} />
      <div className="flex-1">
        <header className="border-b border-border/70 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Admin</div>
            <h1 className="mt-2 font-serif text-4xl font-black tracking-tight">{title}</h1>
            {description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p> : null}
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

