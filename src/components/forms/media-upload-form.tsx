'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MediaUploadForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const response = await fetch("/api/media/upload", {
            method: "POST",
            body: formData,
          });

          const payload = await response.json();
          setMessage(response.ok ? "Upload completed." : payload.error || "Upload failed.");

          if (response.ok) {
            router.refresh();
            event.currentTarget.reset();
          }
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="file">Upload asset</Label>
        <Input id="file" name="file" type="file" accept="image/*,video/*,.pdf,.doc,.docx" required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Uploading..." : "Upload to library"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

