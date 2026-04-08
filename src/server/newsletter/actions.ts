'use server';

import { z } from "zod";

import type { ActionState } from "@/types";
import { prisma } from "@/server/prisma";

const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  firstName: z.string().trim().max(80).optional(),
});

export async function subscribeToNewsletter(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = newsletterSchema.safeParse({
    email: String(formData.get("email") || "").trim().toLowerCase(),
    firstName: String(formData.get("firstName") || "").trim() || undefined,
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please correct the highlighted fields.",
    };
  }

  await prisma.subscriber.upsert({
    where: { email: parsed.data.email },
    update: {
      firstName: parsed.data.firstName,
      status: "ACTIVE",
      source: "site-form",
    },
    create: {
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      source: "site-form",
    },
  });

  return {
    ok: true,
    message: "You're subscribed to the Redwire briefing.",
  };
}

