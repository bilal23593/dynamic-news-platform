import type { NextRequest } from "next/server";

import { finalizeImport, runDryImport } from "@/lib/wordpress-import";
import { wordpressImportSchema } from "@/lib/wordpress-import/validators/payload";
import { getSessionUser } from "@/server/auth/session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = wordpressImportSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid import request.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.mode === "dry-run") {
    const result = runDryImport({
      format: parsed.data.format,
      payload: parsed.data.payload,
    });
    return Response.json({ result });
  }

  const result = await finalizeImport(
    {
      format: parsed.data.format,
      payload: parsed.data.payload,
    },
    user.id,
  );

  return Response.json({ result });
}

