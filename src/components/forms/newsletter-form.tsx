'use client';

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { subscribeToNewsletter } from "@/server/newsletter/actions";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState(subscribeToNewsletter, initialState);

  return (
    <form action={action} className={compact ? "grid gap-3 md:grid-cols-[1fr_1fr_auto]" : "grid gap-4"}>
      {!compact ? (
        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" placeholder="Your name" />
        </div>
      ) : null}
      <div className="grid gap-2">
        {!compact ? <Label htmlFor="email">Email address</Label> : null}
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      {compact ? <Input name="firstName" placeholder="First name" /> : null}
      <div className={compact ? "self-end" : ""}>
        <SubmitButton className={compact ? "w-full md:w-auto" : "w-full"}>
          Subscribe
        </SubmitButton>
      </div>
      {state?.message ? (
        <p className="text-sm text-muted-foreground md:col-span-full" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
