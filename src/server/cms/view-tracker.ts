import "server-only";

import { prisma } from "@/server/prisma";

type ArticleViewQueueState = {
  counts: Map<string, number>;
  flushPromise: Promise<void> | null;
  flushTimer: ReturnType<typeof setTimeout> | null;
};

declare global {
  var __newsChannelArticleViewQueue__: ArticleViewQueueState | undefined;
}

const VIEW_FLUSH_INTERVAL_MS = 15_000;
const VIEW_FLUSH_THRESHOLD = 25;
const MAX_TRACKED_ARTICLES = 5_000;

function getQueueState(): ArticleViewQueueState {
  if (!global.__newsChannelArticleViewQueue__) {
    global.__newsChannelArticleViewQueue__ = {
      counts: new Map<string, number>(),
      flushPromise: null,
      flushTimer: null,
    };
  }

  return global.__newsChannelArticleViewQueue__;
}

function getQueuedViewCount(state: ArticleViewQueueState) {
  let total = 0;

  for (const count of state.counts.values()) {
    total += count;
  }

  return total;
}

function scheduleFlush(state: ArticleViewQueueState) {
  if (state.flushTimer) {
    return;
  }

  state.flushTimer = setTimeout(() => {
    void flushQueuedArticleViews();
  }, VIEW_FLUSH_INTERVAL_MS);

  if (typeof state.flushTimer === "object" && "unref" in state.flushTimer) {
    state.flushTimer.unref();
  }
}

export async function flushQueuedArticleViews() {
  const state = getQueueState();

  if (state.flushPromise) {
    return state.flushPromise;
  }

  if (state.flushTimer) {
    clearTimeout(state.flushTimer);
    state.flushTimer = null;
  }

  if (!state.counts.size) {
    return;
  }

  const snapshot = new Map(state.counts);
  state.counts.clear();

  state.flushPromise = (async () => {
    try {
      await prisma.$transaction(
        Array.from(snapshot.entries()).map(([articleId, count]) =>
          prisma.article.updateMany({
            where: { id: articleId },
            data: {
              viewCount: {
                increment: count,
              },
            },
          }),
        ),
      );
    } catch {
      for (const [articleId, count] of snapshot.entries()) {
        state.counts.set(articleId, (state.counts.get(articleId) || 0) + count);
      }

      scheduleFlush(state);
    } finally {
      state.flushPromise = null;
    }
  })();

  return state.flushPromise;
}

export function queueArticleView(articleId: string) {
  if (!articleId) {
    return;
  }

  const state = getQueueState();

  if (!state.counts.has(articleId) && state.counts.size >= MAX_TRACKED_ARTICLES) {
    return;
  }

  state.counts.set(articleId, (state.counts.get(articleId) || 0) + 1);

  if (getQueuedViewCount(state) >= VIEW_FLUSH_THRESHOLD) {
    void flushQueuedArticleViews();
    return;
  }

  scheduleFlush(state);
}
