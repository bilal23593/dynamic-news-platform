import { htmlToPlainText } from "../src/lib/content";
import {
  buildUnavailableVideoNoticeHtml,
  buildVideoEmbedMarkup,
  buildVideoLinkMarkup,
  extractVideoEmbedUrlsFromHtml,
  getVideoEmbedAvailability,
  injectVideoBlockIntoHtml,
  isDirectEmbeddableVideoUrl,
  normalizeVideoEmbedUrl,
  replaceIframeUrlInHtml,
} from "../src/lib/video-embeds";
import { calculateReadTime } from "../src/lib/utils";
import { prisma } from "../src/server/prisma";

const CONCURRENCY = 6;

async function runWithConcurrency<T>(items: T[], worker: (item: T) => Promise<void>) {
  let index = 0;

  async function next() {
    const currentIndex = index++;
    if (currentIndex >= items.length) {
      return;
    }

    await worker(items[currentIndex]);
    await next();
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => next()));
}

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ videoEmbedUrl: { not: null } }, { contentHtml: { contains: "<iframe" } }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      contentHtml: true,
      videoEmbedUrl: true,
    },
    orderBy: { publishAt: "desc" },
  });

  const availabilityCache = new Map<string, Promise<"live" | "gone" | "unknown">>();
  const getAvailability = (url: string) => {
    if (!availabilityCache.has(url)) {
      availabilityCache.set(url, getVideoEmbedAvailability(url));
    }

    return availabilityCache.get(url)!;
  };

  let updatedArticles = 0;
  let removedDeadEmbeds = 0;
  let injectedEmbeds = 0;
  let injectedVideoLinks = 0;
  let normalizedUrls = 0;

  await runWithConcurrency(articles, async (article) => {
    let nextHtml = article.contentHtml;
    const originalVideoUrl = article.videoEmbedUrl || null;
    let nextVideoUrl = normalizeVideoEmbedUrl(article.videoEmbedUrl) || null;

    if (originalVideoUrl && nextVideoUrl !== originalVideoUrl) {
      normalizedUrls += 1;
    }

    const iframeUrls = extractVideoEmbedUrlsFromHtml(nextHtml);
    const candidateUrls = Array.from(new Set([...iframeUrls, ...(nextVideoUrl ? [nextVideoUrl] : [])]));
    const availabilityEntries = await Promise.all(
      candidateUrls.map(async (url) => [url, await getAvailability(url)] as const),
    );
    const availabilityByUrl = new Map(availabilityEntries);

    for (const iframeUrl of iframeUrls) {
      if (availabilityByUrl.get(iframeUrl) === "gone") {
        nextHtml = replaceIframeUrlInHtml(nextHtml, iframeUrl, buildUnavailableVideoNoticeHtml(iframeUrl));
        removedDeadEmbeds += 1;
      }
    }

    if (nextVideoUrl) {
      const availability = availabilityByUrl.get(nextVideoUrl) || "unknown";

      if (availability === "gone") {
        nextVideoUrl = null;

        if (!iframeUrls.length) {
          nextHtml = injectVideoBlockIntoHtml(nextHtml, buildUnavailableVideoNoticeHtml(originalVideoUrl));
          removedDeadEmbeds += 1;
        }
      } else if (!iframeUrls.length) {
        if (isDirectEmbeddableVideoUrl(nextVideoUrl)) {
          const markup = buildVideoEmbedMarkup(nextVideoUrl, article.title);
          if (markup) {
            nextHtml = injectVideoBlockIntoHtml(nextHtml, markup);
            injectedEmbeds += 1;
          }
        } else {
          const markup = buildVideoLinkMarkup(nextVideoUrl, article.title);
          if (markup) {
            nextHtml = injectVideoBlockIntoHtml(nextHtml, markup);
            injectedVideoLinks += 1;
          }
        }
      }
    }

    if (nextHtml === article.contentHtml && nextVideoUrl === originalVideoUrl) {
      return;
    }

    const contentText = htmlToPlainText(nextHtml);

    await prisma.article.update({
      where: { id: article.id },
      data: {
        contentHtml: nextHtml,
        contentText,
        readTime: calculateReadTime(contentText),
        videoEmbedUrl: nextVideoUrl,
      },
    });

    updatedArticles += 1;
    console.log(`Updated ${article.slug}`);
  });

  console.log("");
  console.log(`Checked ${articles.length} articles with imported video references.`);
  console.log(`Updated ${updatedArticles} articles.`);
  console.log(`Removed ${removedDeadEmbeds} dead embedded video blocks.`);
  console.log(`Injected ${injectedEmbeds} live embeds where a video URL existed without iframe markup.`);
  console.log(`Injected ${injectedVideoLinks} external video link blocks.`);
  console.log(`Normalized ${normalizedUrls} stored video URLs.`);
  console.log(`Checked ${availabilityCache.size} unique video URLs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
