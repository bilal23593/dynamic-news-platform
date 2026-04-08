import { HomepageSection } from "@/features/homepage/components/homepage-section";
import { getHomepageData } from "@/server/cms/public";

export const revalidate = 180;

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-6">
      {data.sections.map((section, index) => (
        <HomepageSection key={section.key} section={section} index={index} />
      ))}
    </main>
  );
}
