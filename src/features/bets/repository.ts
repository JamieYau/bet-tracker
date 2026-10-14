import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { isDemo } from "@/lib/config";
import { database } from "@/lib/db/server";
import { demoMutate, demoRead } from "@/lib/demo-store";
import { normalizeLedger } from "./normalize-ledger";
import {
  readLedger,
  savePostgresBet,
  savePostgresDisplayMode,
  savePostgresOption,
  savePostgresPreferences,
  setPostgresBetDeleted,
  settlePostgresBet,
} from "./postgres";
import type { Bet, BetInput, Ledger } from "./types";
import { confirmedBetSchema, type settlementSchema } from "./validation";

export async function getLedger(includeDeleted = false): Promise<Ledger> {
  const owner = await requireOwner();
  if (isDemo()) {
    const ledger = await demoRead();
    return normalizeLedger({
      ...ledger,
      bets: ledger.bets.filter(
        (bet) => bet.ownerId === owner && (includeDeleted || !bet.deletedAt),
      ),
    });
  }
  return readLedger(database(), owner, includeDeleted);
}

export async function saveBet(
  id: string,
  version: number,
  input: BetInput,
  confirm: boolean,
  allowDuplicate: boolean,
) {
  const owner = await requireOwner();
  confirmedBetSchema.parse(input);
  if (isDemo())
    return demoMutate((ledger) => {
      const existing = ledger.bets.find((bet) => bet.id === id);
      if (existing && existing.ownerId !== owner)
        throw new Error("Unauthorized");
      if (existing?.deletedAt)
        throw new Error("Restore this bet from Trash before editing.");
      const stored = existing as
        | (Bet & { confirmedFromVersion?: number })
        | undefined;
      if (confirm && stored?.confirmedFromVersion === version) return id;
      if ((existing?.version ?? 0) !== version)
        throw new Error("This bet changed. Refresh before editing.");
      const status: Bet["status"] =
        existing?.status === "settled" ? "settled" : "open";
      if (
        !allowDuplicate &&
        input.reference &&
        ledger.bets.some(
          (bet) =>
            bet.ownerId === owner &&
            bet.id !== id &&
            !bet.deletedAt &&
            bet.bookmakerId === input.bookmakerId &&
            bet.reference === input.reference,
        )
      )
        throw new Error(
          "Duplicate reference. Review the existing bet or tick Record despite duplicate warning.",
        );
      for (const [list, optionId, oldId] of [
        [ledger.bookmakers, input.bookmakerId, existing?.bookmakerId],
        [ledger.sources, input.sourceId, existing?.sourceId],
      ] as const)
        if (
          !list.some(
            (option) =>
              option.id === optionId && (option.active || option.id === oldId),
          )
        )
          throw new Error("Choose an active bookmaker and source.");
      const bet = {
        ...existing,
        ...input,
        unitSizePence: existing
          ? (existing.unitSizePence ?? input.unitSizePence ?? null)
          : input.unitSizePence === undefined
            ? (ledger.preferences?.unitSizePence ?? null)
            : input.unitSizePence,
        id,
        ownerId: owner,
        status,
        version: version + 1,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        settlements: existing?.settlements ?? [],
        confirmedFromVersion: !existing
          ? version
          : stored?.confirmedFromVersion,
      };
      ledger.bets = ledger.bets.filter((bet) => bet.id !== id);
      ledger.bets.push(bet);
      return id;
    });
  return savePostgresBet(
    database(),
    owner,
    id,
    version,
    input,
    confirm,
    allowDuplicate,
  );
}

export async function settleBet(input: z.infer<typeof settlementSchema>) {
  const owner = await requireOwner();
  if (isDemo())
    return demoMutate((ledger) => {
      const bet = ledger.bets.find(
        (bet) => bet.id === input.betId && bet.ownerId === owner,
      );
      if (!bet) throw new Error("Bet not found.");
      if (bet.deletedAt)
        throw new Error("Restore this bet from Trash before settling.");
      if (bet.settlements.some((item) => item.requestKey === input.requestKey))
        return bet.id;
      if (bet.version !== input.version)
        throw new Error("This bet changed. Refresh before settling.");
      if (bet.settlements.length && !input.reason.trim())
        throw new Error("Add a reason for the correction.");
      bet.settlements.push({
        ...input,
        id: randomUUID(),
        betId: bet.id,
        revision: bet.settlements.length + 1,
        createdAt: new Date().toISOString(),
      });
      bet.status = "settled";
      bet.version += 1;
      return bet.id;
    });
  return settlePostgresBet(database(), owner, input);
}

export async function saveOption(
  kind: "bookmakers" | "sources",
  id: string,
  name: string,
  active: boolean,
) {
  const owner = await requireOwner();
  if (isDemo())
    return demoMutate((ledger) => {
      const existing = ledger[kind].find((option) => option.id === id);
      if (
        kind === "sources" &&
        existing?.name === "Me" &&
        (name !== "Me" || !active)
      )
        throw new Error("Me is the default source and cannot be changed.");
      if (
        ledger[kind].some((option) => option.id !== id && option.name === name)
      )
        throw new Error("That name already exists.");
      ledger[kind] = ledger[kind].filter((option) => option.id !== id);
      ledger[kind].push({ id, name, active });
      return id;
    });
  return savePostgresOption(database(), owner, kind, id, name, active);
}

export async function setBetDeleted(
  id: string,
  version: number,
  deleted: boolean,
) {
  const owner = await requireOwner();
  if (isDemo())
    return demoMutate((ledger) => {
      const bet = ledger.bets.find(
        (bet) => bet.id === id && bet.ownerId === owner,
      );
      if (!bet) throw new Error("Bet not found.");
      if (bet.version !== version)
        throw new Error(
          "This bet changed. Refresh before deleting or restoring.",
        );
      if (Boolean(bet.deletedAt) === deleted) return id;
      bet.deletedAt = deleted ? new Date().toISOString() : null;
      bet.version += 1;
      return id;
    });
  return setPostgresBetDeleted(database(), owner, id, version, deleted);
}

export async function savePreferences(
  unitSizePence: number | null,
  displayMode: "gbp" | "units",
  version: number,
) {
  const owner = await requireOwner();
  if (isDemo())
    return demoMutate((ledger) => {
      if ((ledger.preferences?.version ?? 0) !== version)
        throw new Error("Settings changed. Refresh before saving.");
      ledger.preferences = { unitSizePence, displayMode, version: version + 1 };
    });
  return savePostgresPreferences(
    database(),
    owner,
    unitSizePence,
    displayMode,
    version,
  );
}
export async function saveDisplayMode(displayMode: "gbp" | "units") {
  const owner = await requireOwner();
  if (isDemo())
    return demoMutate((ledger) => {
      const current = ledger.preferences ?? {
        unitSizePence: null,
        displayMode: "gbp",
        version: 0,
      };
      if (displayMode === "units" && !current.unitSizePence)
        throw new Error("Set your unit size in Settings first.");
      ledger.preferences = {
        ...current,
        displayMode,
        version: current.version + 1,
      };
    });
  return savePostgresDisplayMode(database(), owner, displayMode);
}
