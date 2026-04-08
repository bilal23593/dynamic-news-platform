import { z } from "zod";

export const wordpressImportSchema = z.object({
  mode: z.enum(["dry-run", "finalize"]),
  format: z.enum(["xml", "json", "csv"]),
  payload: z.string().trim().min(20),
});

