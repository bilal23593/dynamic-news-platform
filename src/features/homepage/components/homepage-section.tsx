import type { Route } from "next";
import Link from "next/link";

import { NewsletterForm } from "@/components/forms/newsletter-form";
import { AdSlotBlock } from "@/components/shared/ad-slot-block";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { StoryCard } from "@/components/shared/story-card";
import type { HomepageSectionData } from "@/types/cms";

export function shouldRenderHomepageSection(section: HomepageSectionData) {
  if (section.type === "NEWSLETTER_CTA") {
    return true;
  }

  if (section.type === "SPONSORED_BLOCK" || section.type === "AD_SLOT_BLOCK") {
    return Boolean(section.adSlot);
  }

  return section.items.length > 0 || Boolean(section.adSlot);
}

function defaultEyebrow(type: string) {
  switch (type) {
    case "LATEST_NEWS":
      return "Latest";
    case "VIDEO_HIGHLIGHTS":
      return "Video";
    case "MOST_READ":
      return "Most Read";
    case "TRENDING":
      return "Trending";
    case "EDITOR_PICKS":
      return "Editorial";
    default:
      return type.replaceAll("_", " ");
  }
}

function defaultHref(section: HomepageSectionData) {
  if (section.settings?.viewAllHref) {
    return section.settings.viewAllHref;
  }

  if (section.type === "LATEST_NEWS") return "/news";
  if (section.type === "VIDEO_HIGHLIGHTS") return "/videos";
  return undefined;
}

function defaultLayout(section: HomepageSectionData) {
  if (section.settings?.layout) {
    return section.settings.layout;
  }

  if (section.type === "HERO") return "split";
  if (section.type === "VIDEO_HIGHLIGHTS") return "compact";
  if (section.type === "CATEGORY_BLOCK" || section.type === "EDITOR_PICKS") return "dense";
  return "cards";
}

function SectionActionLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href as Route} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function UtilitySection({ section, index }: { section: HomepageSectionData; index: number }) {
  const isWeather = section.settings?.layout === "weather";

  return (
    <Reveal delay={index * 0.04}>
      <section
        className={
          isWeather
            ? "rounded-[var(--radius)] border border-border/70 bg-[linear-gradient(135deg,#fff7f7,#fff)] p-6 shadow-[0_16px_40px_rgba(17,17,17,0.08)] lg:p-8"
            : "rounded-[var(--radius)] border border-primary/10 bg-[linear-gradient(135deg,#111111,#2a2a2a)] p-6 text-white shadow-[0_20px_60px_rgba(17,17,17,0.18)] lg:p-8"
        }
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_0.9fr]">
          <div className="space-y-4">
            <div
              className={
                isWeather
                  ? "text-[11px] font-bold uppercase tracking-[0.2em] text-primary"
                  : "text-[11px] font-bold uppercase tracking-[0.2em] text-white/65"
              }
            >
              {section.settings?.eyebrow || defaultEyebrow(section.type)}
            </div>
            <h2
              className={
                isWeather
                  ? "font-serif text-3xl font-black tracking-tight text-foreground lg:text-4xl"
                  : "font-serif text-3xl font-black tracking-tight lg:text-4xl"
              }
            >
              {section.title}
            </h2>
            {section.settings?.promoText || section.description ? (
              <p className={isWeather ? "max-w-2xl text-base leading-8 text-muted-foreground" : "max-w-2xl text-base leading-8 text-white/75"}>
                {section.settings?.promoText || section.description}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {section.settings?.ctaHref && section.settings?.ctaLabel ? (
                <SectionActionLink
                  href={section.settings.ctaHref}
                  className={
                    isWeather
                      ? "rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white"
                      : "rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-secondary"
                  }
                >
                  {section.settings.ctaLabel}
                </SectionActionLink>
              ) : null}
              {defaultHref(section) ? (
                <SectionActionLink
                  href={defaultHref(section)!}
                  className={
                    isWeather
                      ? "rounded-full border border-border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-foreground"
                      : "rounded-full border border-white/20 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85"
                  }
                >
                  {section.settings?.viewAllLabel || "Explore"}
                </SectionActionLink>
              ) : null}
            </div>
          </div>

            <div className="grid gap-3">
            {section.items.slice(0, 3).map((article) => (
              <Link
                key={article.slug}
                href={`/article/${article.slug}`}
                prefetch={false}
                className={
                  isWeather
                    ? "rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(17,17,17,0.06)]"
                    : "rounded-2xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur"
                }
              >
                <div className={isWeather ? "mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary" : "mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55"}>
                  {article.category.label || article.category.name}
                </div>
                <div className={isWeather ? "font-serif text-xl font-black leading-snug text-foreground" : "font-serif text-xl font-black leading-snug text-white"}>
                  {article.title}
                </div>
              </Link>
            ))}
            {section.adSlot ? <AdSlotBlock slot={section.adSlot} className={isWeather ? "" : "border-white/10 bg-white/6 text-white"} /> : null}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function DenseStorySection({ section, index }: { section: HomepageSectionData; index: number }) {
  const lead = section.items[0];
  const trailing = section.items.slice(1);

  if (!lead) return null;

  return (
    <Reveal delay={index * 0.04}>
      <section className="space-y-6">
        <SectionHeading
          title={section.title}
          eyebrow={section.settings?.eyebrow || defaultEyebrow(section.type)}
          href={defaultHref(section)}
          linkLabel={section.settings?.viewAllLabel || "View more"}
        />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <StoryCard article={lead} variant="lead" />
          <div className="space-y-4">
            {trailing.map((article) => (
              <Link
                key={article.slug}
                href={`/article/${article.slug}`}
                prefetch={false}
                className="block rounded-[var(--radius)] border border-border/70 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(17,17,17,0.05)] transition-colors hover:border-primary"
              >
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  {article.category.label || article.category.name}
                </div>
                <div className="font-serif text-xl font-black leading-snug text-foreground">{article.title}</div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function CompactStorySection({ section, index }: { section: HomepageSectionData; index: number }) {
  return (
    <Reveal delay={index * 0.04}>
      <section className="space-y-6">
        <SectionHeading
          title={section.title}
          eyebrow={section.settings?.eyebrow || defaultEyebrow(section.type)}
          href={defaultHref(section)}
          linkLabel={section.settings?.viewAllLabel || "View more"}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {section.items.map((article) => (
            <StoryCard key={article.slug} article={article} variant="compact" />
          ))}
        </div>
      </section>
    </Reveal>
  );
}

export function HomepageSection({ section, index }: { section: HomepageSectionData; index: number }) {
  if (!shouldRenderHomepageSection(section)) {
    return null;
  }

  if (section.type === "BREAKING_STRIP") {
    return (
      <Reveal delay={index * 0.04}>
        <section className="rounded-[var(--radius)] border border-primary/15 bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.05)]">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
              Breaking
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            {section.items.map((article) => (
              <Link
                key={article.slug}
                href={`/article/${article.slug}`}
                prefetch={false}
                className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm font-semibold leading-6 text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>
    );
  }

  if (section.type === "NEWSLETTER_CTA") {
    return (
      <Reveal delay={index * 0.04}>
        <section className="rounded-[var(--radius)] border border-primary/15 bg-[linear-gradient(135deg,#111111,#2a2a2a)] p-8 text-white shadow-[0_20px_60px_rgba(17,17,17,0.18)]">
          <SectionHeading
            title={section.title}
            eyebrow={section.settings?.eyebrow || "Newsletter"}
            className="mb-6"
            titleClassName="text-white"
            eyebrowClassName="text-white/65"
          />
          <p className="mb-6 max-w-2xl text-lg leading-8 text-white/75">
            {section.settings?.promoText || section.description || "Smart morning updates, sharper context, and no filler."}
          </p>
          <NewsletterForm compact />
        </section>
      </Reveal>
    );
  }

  if (section.type === "SPONSORED_BLOCK" || section.type === "AD_SLOT_BLOCK") {
    return (
      <Reveal delay={index * 0.04}>
        <section className="space-y-4">
          <SectionHeading
            title={section.title}
            eyebrow={section.settings?.eyebrow || "Sponsored"}
            href={defaultHref(section)}
            linkLabel={section.settings?.viewAllLabel || "Learn more"}
          />
          <AdSlotBlock slot={section.adSlot} title={section.settings?.eyebrow || section.adSlot?.sponsorLabel || "Sponsored"} />
        </section>
      </Reveal>
    );
  }

  const layout = defaultLayout(section);

  if (layout === "utility" || layout === "weather") {
    return <UtilitySection section={section} index={index} />;
  }

  if (layout === "dense") {
    return <DenseStorySection section={section} index={index} />;
  }

  if (layout === "compact") {
    return <CompactStorySection section={section} index={index} />;
  }

  return (
    <Reveal delay={index * 0.04}>
      <section className="space-y-6">
        <SectionHeading
          title={section.title}
          eyebrow={section.settings?.eyebrow || defaultEyebrow(section.type)}
          href={defaultHref(section)}
          linkLabel={section.settings?.viewAllLabel || "More"}
        />
        <div
          className={
            section.type === "HERO" || layout === "split"
              ? "grid gap-6 lg:grid-cols-[1.6fr_1fr]"
              : section.type === "LATEST_NEWS"
                ? "grid gap-6 md:grid-cols-2 xl:grid-cols-4"
                : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          }
        >
          {section.items.map((article, itemIndex) => (
            <StoryCard
              key={article.slug}
              article={article}
              priority={index === 0 && itemIndex === 0}
              variant={
                (section.type === "HERO" || layout === "split") && itemIndex === 0
                  ? "lead"
                  : "default"
              }
            />
          ))}
        </div>
      </section>
    </Reveal>
  );
}
