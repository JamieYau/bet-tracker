"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveDisplayMode, savePreferences } from "@/features/bets/repository";
import type { ActionState } from "@/features/bets/types";
import { MAX_PENCE, moneyToPence } from "@/features/settlement/finance";
import { requireOwner } from "@/lib/auth";

export async function preferencesAction(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  try {
    const size = String(form.get("unitSize") ?? "").trim();
    const input = z
      .object({
        unitSizePence: z
          .number()
          .int()
          .min(1, "Unit size must be greater than zero.")
          .max(MAX_PENCE)
          .nullable(),
        displayMode: z.enum(["gbp", "units"]),
        version: z.number().int().min(0),
      })
      .parse({
        unitSizePence: size ? moneyToPence(size) : null,
        displayMode: form.get("displayMode"),
        version: Number(form.get("version")),
      });
    if (input.displayMode === "units" && input.unitSizePence === null)
      throw new Error("Set a unit size to display in units.");
    await savePreferences(
      input.unitSizePence,
      input.displayMode,
      input.version,
    );
  } catch (error) {
    return {
      error:
        error instanceof z.ZodError
          ? error.issues.map((item) => item.message).join(" ")
          : error instanceof Error
            ? error.message
            : "Unable to save settings.",
    };
  }
  revalidatePath("/", "layout");
  return {
    success: "Unit settings saved. Existing bets retain their saved unit size.",
  };
}
export async function displayAction(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  try {
    await saveDisplayMode(
      z.enum(["gbp", "units"]).parse(form.get("displayMode")),
    );
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to change display.",
    };
  }
  revalidatePath("/", "layout");
  return {};
}
