'use server';

import { createHash } from "node:crypto";

import { headers } from "next/headers";
import { z } from "zod";

import type { ActionState } from "@/types";
import { prisma } from "@/server/prisma";

const commentSchema = z.object({
  articleSlug: z.string().min(1),
  authorName: z.string().trim().min(2, "Name is required.").max(80),
  authorEmail: z.string().email("Enter a valid email address."),
  authorWebsite: z.string().url("Use a valid URL.").optional().or(z.literal("")),
  content: z.string().trim().min(12, "Comment is too short.").max(1000),
  website: z.string().optional(),
});

function spamScore(content: string) {
  const lowered = content.toLowerCase();
  let score = 0;
  if (/(buy now|crypto|viagra|seo service|guaranteed traffic)/.test(lowered)) score += 3;
  if ((content.match(/https?:\/\//g) || []).length > 2) score += 3;
  if ((content.match(/!/g) || []).length > 6) score += 1;
  return score;
}

export async function submitComment(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = commentSchema.safeParse({
    articleSlug: String(formData.get("articleSlug") || ""),
    authorName: String(formData.get("authorName") || ""),
    authorEmail: String(formData.get("authorEmail") || "").trim().toLowerCase(),
    authorWebsite: String(formData.get("authorWebsite") || ""),
    content: String(formData.get("content") || ""),
    website: String(formData.get("website") || ""),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Please correct the form errors before posting.",
    };
  }

  if (parsed.data.website) {
    return {
      ok: true,
      message: "Thanks. Your comment is awaiting moderation.",
    };
  }

  const article = await prisma.article.findUnique({
    where: { slug: parsed.data.articleSlug },
    select: { id: true, allowComments: true },
  });

  if (!article || !article.allowComments) {
    return {
      message: "Comments are unavailable for this article.",
    };
  }

  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for") || "";
  const ipHash = forwarded
    ? createHash("sha256").update(forwarded).digest("hex")
    : undefined;
  const score = spamScore(parsed.data.content);

  await prisma.comment.create({
    data: {
      articleId: article.id,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail,
      authorWebsite: parsed.data.authorWebsite || undefined,
      content: parsed.data.content,
      status: score >= 3 ? "SPAM" : "PENDING",
      ipHash,
      userAgent: headerList.get("user-agent") || undefined,
      moderationNotes: score >= 3 ? "Auto-flagged by heuristic spam filter." : undefined,
    },
  });

  return {
    ok: true,
    message:
      score >= 3
        ? "Your comment was submitted for review."
        : "Thanks. Your comment is now awaiting moderation.",
  };
}
