import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_COOKIE_NAME: z.string().default("dynamic_news_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
  DEFAULT_ADMIN_EMAIL: z.string().email().default("editor@redwire.local"),
  DEFAULT_ADMIN_PASSWORD: z.string().min(8).default("Newsroom123!"),
  MEDIA_DISK_ROOT: z.string().default("public/uploads"),
  MEDIA_PUBLIC_BASE: z.string().default("/uploads"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_URL: process.env.APP_URL,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS: process.env.SESSION_TTL_DAYS,
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
  MEDIA_DISK_ROOT: process.env.MEDIA_DISK_ROOT,
  MEDIA_PUBLIC_BASE: process.env.MEDIA_PUBLIC_BASE,
});

export const isDatabaseConfigured = Boolean(env.DATABASE_URL);

