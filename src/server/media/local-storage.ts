import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { nanoid } from "nanoid";

import { env } from "@/lib/env";
import { slugify } from "@/lib/utils";

export async function saveLocalMedia(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name || "") || ".bin";
  const baseName = slugify(path.basename(file.name || "upload", extension)) || "upload";
  const fileName = `${baseName}-${nanoid(6)}${extension.toLowerCase()}`;
  const absoluteDirectory = path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.MEDIA_DISK_ROOT);
  await mkdir(absoluteDirectory, { recursive: true });
  const absolutePath = path.join(absoluteDirectory, fileName);
  await writeFile(absolutePath, buffer);

  return {
    fileName,
    originalName: file.name || fileName,
    mimeType: file.type || "application/octet-stream",
    bytes: buffer.byteLength,
    storageProvider: "local",
    storagePath: absolutePath,
    url: `${env.MEDIA_PUBLIC_BASE}/${fileName}`,
  };
}
