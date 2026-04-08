'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  format: z.enum(["xml", "json", "csv"]),
  payload: z.string().min(20, "Paste a valid export payload."),
});

type FormValues = z.infer<typeof schema>;

export function ImportManagerForm() {
  const [mode, setMode] = useState<"dry-run" | "finalize">("dry-run");
  const [result, setResult] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      format: "xml",
      payload: "",
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>WordPress Import Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => {
              startTransition(async () => {
                setMessage(null);
                const response = await fetch("/api/admin/imports", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...values, mode }),
                });

                const payload = await response.json();
                if (!response.ok) {
                  setMessage(payload.error || "Import request failed.");
                  return;
                }

                setResult(payload.result);
                setMessage(mode === "dry-run" ? "Dry run complete." : "Import finalized.");
              });
            })}
          >
            <div className="grid gap-2">
              <Label htmlFor="format">Input format</Label>
              <select
                id="format"
                className="h-11 rounded-[calc(var(--radius)-2px)] border border-border bg-white px-3"
                {...form.register("format")}
              >
                <option value="xml">WordPress XML</option>
                <option value="json">WordPress API JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payload">Payload</Label>
              <Textarea
                id="payload"
                className="min-h-[360px] font-mono text-xs"
                placeholder="Paste a WordPress export payload here..."
                {...form.register("payload")}
              />
              {form.formState.errors.payload ? (
                <p className="text-sm text-destructive">{form.formState.errors.payload.message}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" onClick={() => setMode("dry-run")} disabled={isPending}>
                {isPending && mode === "dry-run" ? "Running..." : "Run dry import"}
              </Button>
              <Button type="submit" variant="outline" onClick={() => setMode("finalize")} disabled={isPending}>
                {isPending && mode === "finalize" ? "Importing..." : "Finalize import"}
              </Button>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Result</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-6">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              Run a dry import to see parsed counts, warnings, and a preview of the first titles before committing anything to the database.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
