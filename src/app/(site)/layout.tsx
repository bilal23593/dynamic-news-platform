import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getSiteChromeData } from "@/server/cms/public";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { categories, headerAd, footerAd } = await getSiteChromeData();

  return (
    <>
      <PublicHeader categories={categories} headerAd={headerAd} />
      <div className="min-h-[60vh]">{children}</div>
      <PublicFooter footerAd={footerAd} />
    </>
  );
}
