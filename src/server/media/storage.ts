import { prisma } from "@/server/prisma";
import { saveLocalMedia } from "@/server/media/local-storage";

export async function createMediaFromUpload(file: File, createdById?: string) {
  const asset = await saveLocalMedia(file);

  return prisma.media.create({
    data: {
      title: asset.originalName,
      fileName: asset.fileName,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      url: asset.url,
      storagePath: asset.storagePath,
      storageProvider: asset.storageProvider,
      bytes: asset.bytes,
      createdById,
    },
  });
}
