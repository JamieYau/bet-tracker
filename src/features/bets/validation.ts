import { z } from "zod";
import { MAX_PENCE, parseOdds } from "@/features/settlement/finance";
import { OUTCOMES } from "./types";

const text = (max: number) => z.string().trim().max(max);
const odds = z
  .string()
  .refine((value) => {
    try {
      return parseOdds(value) === value;
    } catch {
      return false;
    }
  }, "Enter valid accepted odds.")
  .nullable();
const pence = z.number().int().min(0).max(MAX_PENCE);
export const betSchema = z.object({
  bookmakerId: z.uuid(),
  sourceId: z.uuid(),
  placedAt: z.iso.datetime({ offset: true }),
  sport: text(80),
  selection: text(500),
  market: text(200),
  acceptedOdds: odds,
  cashStakePence: pence,
  freeStakePence: pence,
  freeStakeReturned: z.boolean(),
  betType: z.enum(["single", "acca"]),
  reference: text(150),
  notes: text(2000),
  tags: z.array(text(50).min(1)).max(20),
  legs: z
    .array(
      z.object({
        id: z.uuid(),
        selection: text(500),
        market: text(200),
        sport: text(80),
        odds,
        status: z.enum(["open", "won", "lost", "void"]),
      }),
    )
    .max(30),
});
export const confirmedBetSchema = betSchema.superRefine((bet, context) => {
  if (!bet.selection)
    context.addIssue({
      code: "custom",
      path: ["selection"],
      message: "Add a selection or acca name.",
    });
  if (!bet.sport)
    context.addIssue({
      code: "custom",
      path: ["sport"],
      message: "Add a sport (or Mixed).",
    });
  if (!bet.acceptedOdds)
    context.addIssue({
      code: "custom",
      path: ["acceptedOdds"],
      message: "Add the accepted total odds.",
    });
  if (bet.cashStakePence + bet.freeStakePence === 0)
    context.addIssue({
      code: "custom",
      path: ["cashStakePence"],
      message: "Add a cash or free-bet stake.",
    });
  if (bet.betType === "acca" && bet.legs.length < 2)
    context.addIssue({
      code: "custom",
      path: ["legs"],
      message: "An acca needs at least two legs.",
    });
  if (bet.betType === "single" && bet.legs.length > 1)
    context.addIssue({
      code: "custom",
      path: ["legs"],
      message: "A single can have only one leg.",
    });
  if (
    bet.betType === "acca" &&
    bet.legs.some((leg) => !leg.selection || !leg.sport)
  )
    context.addIssue({
      code: "custom",
      path: ["legs"],
      message: "Each acca leg needs a selection and sport.",
    });
});
export const saveSchema = z.object({
  id: z.uuid(),
  version: z.number().int().min(0),
  confirm: z.boolean(),
  allowDuplicate: z.boolean(),
  bet: betSchema,
});
export const settlementSchema = z
  .object({
    betId: z.uuid(),
    requestKey: z.uuid(),
    version: z.number().int().min(1),
    outcome: z.enum(OUTCOMES),
    returnPence: pence,
    settledAt: z.iso.datetime({ offset: true }),
    earlyPayout: z.boolean(),
    reason: text(1000),
  })
  .refine((value) => !value.earlyPayout || value.outcome === "won", {
    message: "Early payout must use Won.",
    path: ["earlyPayout"],
  });
