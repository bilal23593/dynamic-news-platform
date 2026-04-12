import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

type SyncModel = {
  label: string;
  tableName: string;
  readAll: (client: PrismaClient) => Promise<unknown[]>;
  insertMany: (client: PrismaClient, rows: unknown[]) => Promise<void>;
  count: (client: PrismaClient) => Promise<number>;
};

const SOURCE_DATABASE_URL = process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL;
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL;
const SKIP_TARGET_BACKUP = process.env.SKIP_TARGET_BACKUP === "1";
const chunkSize = Number(process.env.DB_SYNC_CHUNK_SIZE ?? "100");

if (!SOURCE_DATABASE_URL) {
  throw new Error("SOURCE_DATABASE_URL or DATABASE_URL is required.");
}

if (!TARGET_DATABASE_URL) {
  throw new Error("TARGET_DATABASE_URL is required.");
}

if (SOURCE_DATABASE_URL === TARGET_DATABASE_URL) {
  throw new Error("Source and target database URLs must be different.");
}

const source = new PrismaClient({ datasourceUrl: SOURCE_DATABASE_URL });
const target = new PrismaClient({ datasourceUrl: TARGET_DATABASE_URL });

const syncModels: SyncModel[] = [
  {
    label: "roles",
    tableName: "Role",
    readAll: (client) => client.role.findMany(),
    insertMany: async (client, rows) => {
      await client.role.createMany({ data: rows as never[] });
    },
    count: (client) => client.role.count(),
  },
  {
    label: "users",
    tableName: "User",
    readAll: (client) => client.user.findMany(),
    insertMany: async (client, rows) => {
      await client.user.createMany({ data: rows as never[] });
    },
    count: (client) => client.user.count(),
  },
  {
    label: "sessions",
    tableName: "Session",
    readAll: (client) => client.session.findMany(),
    insertMany: async (client, rows) => {
      await client.session.createMany({ data: rows as never[] });
    },
    count: (client) => client.session.count(),
  },
  {
    label: "media",
    tableName: "Media",
    readAll: (client) => client.media.findMany(),
    insertMany: async (client, rows) => {
      await client.media.createMany({ data: rows as never[] });
    },
    count: (client) => client.media.count(),
  },
  {
    label: "author profiles",
    tableName: "AuthorProfile",
    readAll: (client) => client.authorProfile.findMany(),
    insertMany: async (client, rows) => {
      await client.authorProfile.createMany({ data: rows as never[] });
    },
    count: (client) => client.authorProfile.count(),
  },
  {
    label: "categories",
    tableName: "Category",
    readAll: (client) => client.category.findMany(),
    insertMany: async (client, rows) => {
      await client.category.createMany({ data: rows as never[] });
    },
    count: (client) => client.category.count(),
  },
  {
    label: "subcategories",
    tableName: "SubCategory",
    readAll: (client) => client.subCategory.findMany(),
    insertMany: async (client, rows) => {
      await client.subCategory.createMany({ data: rows as never[] });
    },
    count: (client) => client.subCategory.count(),
  },
  {
    label: "tags",
    tableName: "Tag",
    readAll: (client) => client.tag.findMany(),
    insertMany: async (client, rows) => {
      await client.tag.createMany({ data: rows as never[] });
    },
    count: (client) => client.tag.count(),
  },
  {
    label: "ad slots",
    tableName: "AdSlot",
    readAll: (client) => client.adSlot.findMany(),
    insertMany: async (client, rows) => {
      await client.adSlot.createMany({ data: rows as never[] });
    },
    count: (client) => client.adSlot.count(),
  },
  {
    label: "site settings",
    tableName: "SiteSetting",
    readAll: (client) => client.siteSetting.findMany(),
    insertMany: async (client, rows) => {
      await client.siteSetting.createMany({ data: rows as never[] });
    },
    count: (client) => client.siteSetting.count(),
  },
  {
    label: "subscribers",
    tableName: "Subscriber",
    readAll: (client) => client.subscriber.findMany(),
    insertMany: async (client, rows) => {
      await client.subscriber.createMany({ data: rows as never[] });
    },
    count: (client) => client.subscriber.count(),
  },
  {
    label: "import batches",
    tableName: "ImportBatch",
    readAll: (client) => client.importBatch.findMany(),
    insertMany: async (client, rows) => {
      await client.importBatch.createMany({ data: rows as never[] });
    },
    count: (client) => client.importBatch.count(),
  },
  {
    label: "articles",
    tableName: "Article",
    readAll: (client) => client.article.findMany(),
    insertMany: async (client, rows) => {
      await client.article.createMany({ data: rows as never[] });
    },
    count: (client) => client.article.count(),
  },
  {
    label: "pages",
    tableName: "Page",
    readAll: (client) => client.page.findMany(),
    insertMany: async (client, rows) => {
      await client.page.createMany({ data: rows as never[] });
    },
    count: (client) => client.page.count(),
  },
  {
    label: "redirects",
    tableName: "Redirect",
    readAll: (client) => client.redirect.findMany(),
    insertMany: async (client, rows) => {
      await client.redirect.createMany({ data: rows as never[] });
    },
    count: (client) => client.redirect.count(),
  },
  {
    label: "homepage sections",
    tableName: "HomepageSection",
    readAll: (client) => client.homepageSection.findMany(),
    insertMany: async (client, rows) => {
      await client.homepageSection.createMany({ data: rows as never[] });
    },
    count: (client) => client.homepageSection.count(),
  },
  {
    label: "comments",
    tableName: "Comment",
    readAll: (client) => client.comment.findMany(),
    insertMany: async (client, rows) => {
      await client.comment.createMany({ data: rows as never[] });
    },
    count: (client) => client.comment.count(),
  },
  {
    label: "article tags",
    tableName: "ArticleTag",
    readAll: (client) => client.articleTag.findMany(),
    insertMany: async (client, rows) => {
      await client.articleTag.createMany({ data: rows as never[] });
    },
    count: (client) => client.articleTag.count(),
  },
  {
    label: "article gallery items",
    tableName: "ArticleGalleryItem",
    readAll: (client) => client.articleGalleryItem.findMany(),
    insertMany: async (client, rows) => {
      await client.articleGalleryItem.createMany({ data: rows as never[] });
    },
    count: (client) => client.articleGalleryItem.count(),
  },
  {
    label: "article relations",
    tableName: "ArticleRelation",
    readAll: (client) => client.articleRelation.findMany(),
    insertMany: async (client, rows) => {
      await client.articleRelation.createMany({ data: rows as never[] });
    },
    count: (client) => client.articleRelation.count(),
  },
  {
    label: "homepage section items",
    tableName: "HomepageSectionItem",
    readAll: (client) => client.homepageSectionItem.findMany(),
    insertMany: async (client, rows) => {
      await client.homepageSectionItem.createMany({ data: rows as never[] });
    },
    count: (client) => client.homepageSectionItem.count(),
  },
  {
    label: "import logs",
    tableName: "ImportLog",
    readAll: (client) => client.importLog.findMany(),
    insertMany: async (client, rows) => {
      await client.importLog.createMany({ data: rows as never[] });
    },
    count: (client) => client.importLog.count(),
  },
  {
    label: "legacy content maps",
    tableName: "LegacyContentMap",
    readAll: (client) => client.legacyContentMap.findMany(),
    insertMany: async (client, rows) => {
      await client.legacyContentMap.createMany({ data: rows as never[] });
    },
    count: (client) => client.legacyContentMap.count(),
  },
  {
    label: "external source mappings",
    tableName: "ExternalSourceMapping",
    readAll: (client) => client.externalSourceMapping.findMany(),
    insertMany: async (client, rows) => {
      await client.externalSourceMapping.createMany({ data: rows as never[] });
    },
    count: (client) => client.externalSourceMapping.count(),
  },
];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function chunkRows<T>(rows: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

async function backupTarget() {
  const backupRoot = path.join(
    os.tmpdir(),
    "dynamic-news-website-db-sync",
    timestamp(),
  );
  await mkdir(backupRoot, { recursive: true });

  console.log(`Creating target backup in ${backupRoot}`);

  for (const model of syncModels) {
    const rows = await model.readAll(target);
    const filePath = path.join(backupRoot, `${model.tableName}.json`);
    await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
    console.log(`  backed up ${rows.length} ${model.label}`);
  }

  return backupRoot;
}

async function truncateTarget() {
  const tableNames = syncModels
    .map((model) => `"${model.tableName}"`)
    .join(", ");

  await target.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE;`);
}

async function syncModel(model: SyncModel) {
  const rows = await model.readAll(source);
  console.log(`Syncing ${rows.length} ${model.label}`);

  for (const rowsChunk of chunkRows(rows, chunkSize)) {
    if (rowsChunk.length === 0) continue;
    await model.insertMany(target, rowsChunk);
  }
}

async function verifyCounts() {
  const mismatches: string[] = [];

  for (const model of syncModels) {
    const [sourceCount, targetCount] = await Promise.all([
      model.count(source),
      model.count(target),
    ]);

    if (sourceCount !== targetCount) {
      mismatches.push(
        `${model.tableName}: source=${sourceCount}, target=${targetCount}`,
      );
    }
  }

  if (mismatches.length > 0) {
    throw new Error(`Count verification failed:\n${mismatches.join("\n")}`);
  }
}

async function main() {
  console.log("Connecting to source and target databases...");
  await Promise.all([source.$connect(), target.$connect()]);

  if (!SKIP_TARGET_BACKUP) {
    await backupTarget();
  } else {
    console.log("Skipping target backup because SKIP_TARGET_BACKUP=1.");
  }

  console.log("Clearing target tables...");
  await truncateTarget();

  for (const model of syncModels) {
    await syncModel(model);
  }

  console.log("Verifying row counts...");
  await verifyCounts();

  console.log("Database sync completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  });
