import "server-only";

import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { nanoid } from "nanoid";

import { env } from "@/lib/env";
import type { AppPermission } from "@/server/auth/permissions";
import { hasPermission } from "@/server/auth/permissions";
import { prisma } from "@/server/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const getSessionUser = cache(async () => {
  const token = (await cookies()).get(env.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      user: {
        include: {
          role: true,
          authorProfile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
});

export async function createSession(userId: string, options?: { ipAddress?: string; userAgent?: string }) {
  const rawToken = nanoid(48);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(env.SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashToken(token),
      },
    });
  }

  cookieStore.delete(env.SESSION_COOKIE_NAME);
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requirePermission(permission: AppPermission) {
  const user = await requireUser();
  if (!hasPermission(user.role.name, permission)) {
    redirect("/");
  }
  return user;
}

export async function isAuthorized(permission: AppPermission) {
  const user = await getSessionUser();
  return Boolean(user && hasPermission(user.role.name, permission));
}
