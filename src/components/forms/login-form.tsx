'use client';

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction } from "@/server/auth/auth";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="name@example.com" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="Enter your password" required />
      </div>
      <SubmitButton className="w-full">Sign in to the newsroom</SubmitButton>
      {state?.message ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
