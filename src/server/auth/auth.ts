'use server';

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionState } from "@/types";
import { prisma } from "@/server/prisma";
import { createSession, destroySession } from "@/server/auth/session";

export async function loginAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return {
      message: "Email and password are required.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    return {
      message: "Invalid credentials.",
    };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return {
      message: "Invalid credentials.",
    };
  }

  const headerList = await headers();

  await createSession(user.id, {
    ipAddress: headerList.get("x-forwarded-for") || undefined,
    userAgent: headerList.get("user-agent") || undefined,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
