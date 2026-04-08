'use client';

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { submitComment } from "@/server/comments/actions";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export function CommentForm({ articleSlug }: { articleSlug: string }) {
  const [state, action] = useActionState(submitComment, initialState);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="articleSlug" value={articleSlug} />
      <input type="hidden" name="website" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="authorName">Name</Label>
          <Input id="authorName" name="authorName" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="authorEmail">Email</Label>
          <Input id="authorEmail" name="authorEmail" type="email" required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="authorWebsite">Website</Label>
        <Input id="authorWebsite" name="authorWebsite" placeholder="https://example.com" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="content">Comment</Label>
        <Textarea id="content" name="content" placeholder="Join the conversation..." required />
      </div>
      <SubmitButton className="w-full md:w-fit">Post comment</SubmitButton>
      {state?.message ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
