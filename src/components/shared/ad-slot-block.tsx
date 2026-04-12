'use client';

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { hasConfiguredAdCreative } from "@/lib/ads";
import { cn } from "@/lib/utils";
import type { PublicAdSlot } from "@/types/cms";

const AD_READY_SELECTORS = "iframe, img, video, canvas, svg, object, embed, ins";
const HIDDEN_AD_CLASSES = "pointer-events-none fixed left-[-200vw] top-0 z-[-1] w-[min(100vw-2rem,1200px)] opacity-0";

function isVisibleRenderableElement(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  if (styles.display === "none" || styles.visibility === "hidden" || Number(styles.opacity) === 0) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width >= 40 && rect.height >= 20) {
    return true;
  }

  if (element instanceof HTMLImageElement) {
    return element.naturalWidth >= 40 && element.naturalHeight >= 20;
  }

  return false;
}

function hasRenderableAdContent(container: HTMLElement) {
  const adElement = Array.from(container.querySelectorAll<HTMLElement>(AD_READY_SELECTORS)).find(
    isVisibleRenderableElement,
  );

  if (adElement) {
    return true;
  }

  const normalizedText = container.textContent?.replace(/\s+/g, " ").trim() || "";
  if (normalizedText.length >= 24) {
    return true;
  }

  return Array.from(container.querySelectorAll<HTMLElement>("*")).some((element) => {
    const tagName = element.tagName.toLowerCase();
    if (["script", "style", "link", "meta"].includes(tagName)) {
      return false;
    }

    return isVisibleRenderableElement(element);
  });
}

function cloneNodeWithExecutableScripts(node: Node): Node {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return node.cloneNode(true);
  }

  const element = node as HTMLElement;

  if (element.tagName.toLowerCase() === "script") {
    const sourceScript = element as HTMLScriptElement;
    const script = document.createElement("script");

    for (const attribute of Array.from(element.attributes)) {
      script.setAttribute(attribute.name, attribute.value);
    }

    script.text = sourceScript.text || sourceScript.textContent || "";
    return script;
  }

  const clone = element.cloneNode(false) as HTMLElement;

  for (const child of Array.from(element.childNodes)) {
    clone.appendChild(cloneNodeWithExecutableScripts(child));
  }

  return clone;
}

function injectHtmlCreative(container: HTMLElement, html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;

  const fragment = document.createDocumentFragment();
  for (const node of Array.from(template.content.childNodes)) {
    fragment.appendChild(cloneNodeWithExecutableScripts(node));
  }

  container.replaceChildren(fragment);
}

function AdSlotBlockContent({
  title,
  slot,
  resolvedHtml,
  className,
}: {
  title?: string;
  slot?: PublicAdSlot | null;
  resolvedHtml: string | null;
  className?: string;
}) {
  const sponsorLabel = title || slot?.sponsorLabel || "Sponsored";
  const htmlMountRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    const container = htmlMountRef.current;

    if (!container || !resolvedHtml) {
      return;
    }

    injectHtmlCreative(container, resolvedHtml);

    let disposed = false;

    const checkReady = () => {
      if (!disposed && hasRenderableAdContent(container)) {
        setIsReady(true);
      }
    };

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(checkReady);
    });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            window.requestAnimationFrame(checkReady);
          })
        : null;

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    resizeObserver?.observe(container);

    const timers = [0, 250, 1000, 3000, 6000].map((delay) =>
      window.setTimeout(checkReady, delay),
    );

    return () => {
      disposed = true;
      observer.disconnect();
      resizeObserver?.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
      container.replaceChildren();
    };
  }, [resolvedHtml]);

  if (!slot || hasFailed) return null;

  return (
    <aside
      aria-hidden={!isReady}
      data-ad-state={isReady ? "ready" : "waiting"}
      className={cn(
        "space-y-3 rounded-[var(--radius)] border border-border/70 bg-white p-4 shadow-[0_10px_24px_rgba(17,17,17,0.05)]",
        !isReady && HIDDEN_AD_CLASSES,
        className,
      )}
    >
      {sponsorLabel ? (
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">{sponsorLabel}</div>
      ) : null}
      {slot?.advertiserName ? (
        <div className="text-sm font-semibold">{slot.advertiserName}</div>
      ) : null}
      {resolvedHtml ? (
        <div ref={htmlMountRef} />
      ) : slot?.imageUrl ? (
        <div className="space-y-3">
          {slot.targetUrl ? (
            <a href={slot.targetUrl} target="_blank" rel="sponsored noopener">
              <Image
                src={slot.imageUrl}
                alt={slot.name}
                width={1200}
                height={675}
                sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                className="w-full rounded-xl object-cover"
                onLoad={() => setIsReady(true)}
                onError={() => setHasFailed(true)}
              />
            </a>
          ) : (
            <Image
              src={slot.imageUrl}
              alt={slot.name}
              width={1200}
              height={675}
              sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
              className="w-full rounded-xl object-cover"
              onLoad={() => setIsReady(true)}
              onError={() => setHasFailed(true)}
            />
          )}
          {slot.description ? <p className="text-sm leading-6 opacity-80">{slot.description}</p> : null}
          {slot.targetUrl && slot.ctaLabel ? (
            <a
              href={slot.targetUrl}
              target="_blank"
              rel="sponsored noopener"
              className="inline-flex rounded-full bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2a2a2a]"
            >
              {slot.ctaLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

export function AdSlotBlock({
  title,
  slot,
  html,
  className,
}: {
  title?: string;
  slot?: PublicAdSlot | null;
  html?: string | null;
  className?: string;
}) {
  const resolvedHtml = useMemo(() => slot?.codeHtml?.trim() || html?.trim() || null, [html, slot?.codeHtml]);
  const hasCreative = hasConfiguredAdCreative({
    codeHtml: resolvedHtml,
    imageUrl: slot?.imageUrl,
  });

  if (!slot && !html) return null;
  if (!hasCreative) return null;

  const creativeKey = [slot?.key || "custom", slot?.imageUrl || "", resolvedHtml || ""].join("::");

  return (
    <AdSlotBlockContent
      key={creativeKey}
      title={title}
      slot={slot}
      resolvedHtml={resolvedHtml}
      className={className}
    />
  );
}
