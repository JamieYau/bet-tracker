import { z } from "zod";
import { normalizeMarket, normalizeSport } from "@/features/bets/catalog";
import type { Filters } from "./metrics";

const schema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  bookmaker: z.uuid().optional(),
  source: z.uuid().optional(),
  sport: z.string().trim().max(80).transform(normalizeSport).optional(),
  market: z.string().trim().max(200).transform(normalizeMarket).optional(),
  event: z.string().trim().max(200).optional(),
  direction: z.enum(["over", "under"]).optional(),
  line: z
    .string()
    .regex(/^[+-]?\d+(\.\d{1,6})?$/)
    .refine((value) => Math.abs(Number(value)) <= 1_000_000)
    .optional(),
  inPlay: z.enum(["yes", "no"]).optional(),
  type: z.enum(["single", "acca"]).optional(),
  status: z
    .enum(["draft", "open", "settled", "won", "lost", "void", "cash_out"])
    .optional(),
});
export function readFilters(
  params: Record<string, string | string[] | undefined>,
): Filters {
  const clean = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => typeof value === "string" && value !== "",
    ),
  );
  const parsed = schema.safeParse(clean);
  return parsed.success ? parsed.data : {};
}
