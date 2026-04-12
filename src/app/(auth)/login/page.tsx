import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(179,13,22,0.18),transparent_30%),linear-gradient(180deg,#111,#1a1a1a)] px-4 py-12">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_420px]">
        <section className="space-y-6 text-white">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            {siteConfig.name} CMS
          </div>
          <h1 className="max-w-2xl font-serif text-5xl font-black tracking-tight lg:text-7xl">
            Publish faster, edit smarter, and keep migration-ready structure.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-white/70">
            This newsroom backend ships with editorial workflow, metadata controls, media handling, and
            WordPress migration support built into the core architecture.
          </p>
        </section>
        <Card className="border-white/10 bg-white">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Sign in with your newsroom account.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
