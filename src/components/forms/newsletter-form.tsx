'use client';

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { subscribeToNewsletter } from "@/server/newsletter/actions";
import type { ActionState } from "@/types";
import { cn } from "@/lib/utils";

const initialState: ActionState = {};

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState(subscribeToNewsletter, initialState);

  return (
    <form action={action} className={compact ? "grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto]" : "grid gap-4"}>
      {!compact ? (
        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" placeholder="Your name" />
        </div>
      ) : null}
      <div className="grid gap-2">
        {!compact ? <Label htmlFor="email">Email address</Label> : <Label htmlFor="email" className="sr-only">Email address</Label>}
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      {compact ? (
        <div className="grid gap-2">
          <Label htmlFor="newsletterFirstName" className="sr-only">
            First name
          </Label>
          <Input id="newsletterFirstName" name="firstName" placeholder="First name" />
        </div>
      ) : null}
      <div className={compact ? "self-end sm:justify-self-start" : ""}>
        <SubmitButton className={cn("w-full", compact ? "sm:w-auto" : "")}>
          Subscribe
        </SubmitButton>
      </div>
      {state?.message ? (
        <p className="text-sm text-muted-foreground sm:col-span-full" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
