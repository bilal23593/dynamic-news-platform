import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/server/auth/session";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const allowed = await isAuthorized("manage_articles");
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const excludeId = request.nextUrl.searchParams.get("excludeId")?.trim() || "";
  const take = Math.min(Number(request.nextUrl.searchParams.get("limit") || 20), 30);

  const items = await prisma.article.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ["DRAFT", "SCHEDULED", "PUBLISHED"] },
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { publishAt: "desc" }],
    take,
    select: {
      id: true,
      title: true,
      status: true,
      category: { select: { name: true } },
      subCategory: { select: { name: true } },
    },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      label: item.title,
      description: [item.status, item.category.name, item.subCategory?.name].filter(Boolean).join(" · "),
    })),
  });
}
