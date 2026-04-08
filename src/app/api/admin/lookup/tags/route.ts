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
  const take = Math.min(Number(request.nextUrl.searchParams.get("limit") || 20), 30);

  const items = await prisma.tag.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      label: item.name,
      description: item.description || item.slug,
    })),
  });
}
