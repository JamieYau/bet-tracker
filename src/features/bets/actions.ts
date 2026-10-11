"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { moneyToPence, parseOdds } from "@/features/settlement/finance";
import { requireOwner } from "@/lib/auth";
import { londonToUtc } from "@/lib/format";
import { getLedger, saveBet, saveOption, settleBet } from "./repository";
import type { ActionState } from "./types";
import { confirmedBetSchema, saveSchema, settlementSchema } from "./validation";

function failure(error: unknown): ActionState {
  if (error instanceof z.ZodError)
    return {
      error: "Check the highlighted fields.",
      errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    };
  return {
    error:
      error instanceof Error
        ? error.message
        : "Unable to save. Your entries are still here; please retry.",
  };
}
const field = (form: FormData, name: string) => String(form.get(name) ?? "");
export async function recordAction(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  let id: string;
  try {
    const raw = JSON.parse(field(form, "payload"));
    const input = saveSchema.parse({
      id: field(form, "id"),
      version: Number(field(form, "version")),
      confirm: field(form, "intent") === "confirm",
      allowDuplicate: form.get("allowDuplicate") === "on",
      bet: {
        ...raw,
        placedAt: londonToUtc(raw.placedAt),
        acceptedOdds: raw.acceptedOdds.trim()
          ? parseOdds(raw.acceptedOdds)
          : null,
        cashStakePence: moneyToPence(raw.cashStake || "0"),
        freeStakePence: moneyToPence(raw.freeStake || "0"),
        tags: String(raw.tagsText || "")
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean),
        legs: raw.legs.map((leg: { odds: string | null }) => ({
          ...leg,
          odds: leg.odds?.trim() ? parseOdds(leg.odds) : null,
        })),
      },
    });
    const ledger = await getLedger();
    const existing = ledger.bets.find((bet) => bet.id === input.id);
    if (input.confirm || existing?.status === "open")
      confirmedBetSchema.parse(input.bet);
    id = await saveBet(
      input.id,
      input.version,
      input.bet,
      input.confirm,
      input.allowDuplicate,
    );
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  redirect(`/bets/${id}`);
}
export async function settlementAction(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  let id: string;
  try {
    const input = settlementSchema.parse({
      betId: field(form, "betId"),
      requestKey: field(form, "requestKey"),
      version: Number(field(form, "version")),
      outcome: field(form, "outcome"),
      returnPence: moneyToPence(field(form, "return")),
      settledAt: londonToUtc(field(form, "settledAt")),
      earlyPayout: form.get("earlyPayout") === "on",
      reason: field(form, "reason"),
    });
    id = await settleBet(input);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  redirect(`/bets/${id}`);
}
export async function optionAction(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  try {
    const input = z
      .object({
        kind: z.enum(["bookmakers", "sources"]),
        id: z.uuid(),
        name: z.string().trim().min(1).max(80),
        active: z.boolean(),
      })
      .parse({
        kind: field(form, "kind"),
        id: field(form, "id"),
        name: field(form, "name"),
        active: form.get("active") === "on",
      });
    await saveOption(input.kind, input.id, input.name, input.active);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { success: "List updated." };
}
