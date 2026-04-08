'use client';

import { useDeferredValue, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  id: string;
  label: string;
  description?: string;
};

function mergeOptions(...groups: Array<SearchableOption[] | undefined>) {
  const map = new Map<string, SearchableOption>();

  for (const group of groups) {
    for (const item of group || []) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}

export function SearchableMultiSelect({
  name,
  label,
  description,
  searchEndpoint,
  placeholder,
  defaultSelected = [],
  initialOptions = [],
  emptyLabel = "No matching items yet.",
}: {
  name: string;
  label: string;
  description?: string;
  searchEndpoint: string;
  placeholder: string;
  defaultSelected?: SearchableOption[];
  initialOptions?: SearchableOption[];
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState<SearchableOption[]>(defaultSelected);
  const [results, setResults] = useState<SearchableOption[]>(
    mergeOptions(defaultSelected, initialOptions),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = deferredQuery.trim();

    if (!search) {
      setResults(mergeOptions(selected, initialOptions));
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const separator = searchEndpoint.includes("?") ? "&" : "?";
        const response = await fetch(
          `${searchEndpoint}${separator}q=${encodeURIComponent(search)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search failed.");
        }

        const payload = (await response.json()) as { items?: SearchableOption[] };
        setResults(mergeOptions(selected, payload.items));
      } catch (searchError) {
        if ((searchError as Error).name === "AbortError") {
          return;
        }

        setError("Search is temporarily unavailable.");
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredQuery, initialOptions, searchEndpoint, selected]);

  function isSelected(id: string) {
    return selected.some((item) => item.id === id);
  }

  function addItem(item: SearchableOption) {
    setSelected((current) => {
      if (current.some((entry) => entry.id === item.id)) {
        return current;
      }

      return [...current, item];
    });
    setResults((current) => mergeOptions(current, [item]));
  }

  function removeItem(id: string) {
    setSelected((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor={`${name}-search`}>{label}</Label>
        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>

      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => removeItem(item.id)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
            >
              <span className="max-w-[24ch] truncate">{item.label}</span>
              <span aria-hidden="true">x</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-[calc(var(--radius)-2px)] border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
          Nothing selected yet.
        </div>
      )}

      {selected.map((item) => (
        <input key={`${name}-${item.id}`} type="hidden" name={name} value={item.id} />
      ))}

      <div className="grid gap-3 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/10 p-3">
        <Input
          id={`${name}-search`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />

        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {results.length ? (
            results.map((item) => {
              const selectedItem = isSelected(item.id);

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-[calc(var(--radius)-4px)] border border-border/70 bg-white px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{item.label}</div>
                    {item.description ? (
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => (selectedItem ? removeItem(item.id) : addItem(item))}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]",
                      selectedItem
                        ? "border border-border bg-white text-foreground"
                        : "bg-primary text-white",
                    )}
                  >
                    {selectedItem ? "Remove" : "Add"}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="rounded-[calc(var(--radius)-4px)] border border-dashed border-border bg-white px-3 py-4 text-sm text-muted-foreground">
              {emptyLabel}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{selected.length} selected</span>
          <span>{isLoading ? "Searching..." : error || "Search by title, slug, or tag name."}</span>
        </div>
      </div>
    </div>
  );
}
