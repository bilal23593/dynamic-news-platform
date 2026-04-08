import { PrismaClient } from "@prisma/client";

declare global {
  var __redwirePrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__redwirePrisma__ ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__redwirePrisma__ = prisma;
}
