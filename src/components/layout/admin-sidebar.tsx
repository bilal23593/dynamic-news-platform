import { Logo } from "@/components/shared/logo";
import { logoutAction } from "@/server/auth/auth";
import { adminNavigation, hasPermission } from "@/server/auth/permissions";

export function AdminSidebar({
  roleName,
  userName,
}: {
  roleName: string;
  userName: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border/70 bg-white lg:flex lg:flex-col lg:overflow-hidden">
      <div className="flex h-full min-h-0 flex-col p-6">
      <Logo />
      <div className="mt-8 rounded-[var(--radius)] border border-border/70 bg-muted/40 p-4">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Signed in</div>
        <div className="mt-2 font-serif text-2xl font-black">{userName}</div>
        <div className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">{roleName}</div>
      </div>
      <nav className="mt-8 flex-1 space-y-2 overflow-y-auto pr-2">
        {adminNavigation
          .filter((item) => hasPermission(roleName, item.permission))
          .map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              {item.label}
            </a>
          ))}
      </nav>
      <form action={logoutAction} className="mt-4 border-t border-border/70 pt-4">
        <button className="w-full rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white">
          Log out
        </button>
      </form>
      </div>
    </aside>
  );
}
