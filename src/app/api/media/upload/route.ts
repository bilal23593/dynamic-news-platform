import type { NextRequest } from "next/server";

import { getSessionUser } from "@/server/auth/session";
import { createMediaFromUpload } from "@/server/media/storage";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }

  const asset = await createMediaFromUpload(file, user.id);
  return Response.json({ asset }, { status: 201 });
}

