import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { isDemo } from "@/lib/config";
import { database } from "@/lib/db/server";
import { demoMutate, demoRead } from "@/lib/demo-store";
import {
  readLedger,
  savePostgresBet,
  savePostgresOption,
  settlePostgresBet,
} from "./postgres";
import type { Bet, BetInput, Ledger } from "./types";
import type { settlementSchema } from "./validation";

export async function getLedger(): Promise<Ledger> {
  const owner = await requireOwner();
  if (isDemo()) {
    const ledger = await demoRead();
    return {
      ...ledger,
      bets: ledger.bets.filter((bet) => bet.ownerId === owner),
    };
  }
  return readLedger(database(), owner);
}

export async function saveBet(
  id: string,
  version: number,
  input: BetInput,
  confirm: boolean,
  allowDuplicate: boolean,
) {
  const owner = await requireOwner();
  if (isDemo())
    return demoMutate((ledger) => {
      const existing = ledger.bets.find((bet) => bet.id === id);
      if (existing && existing.ownerId !== owner)
        throw new Error("Unauthorized");
      const stored = existing as
        | (Bet & { confirmedFromVersion?: number })
        | undefined;
      if (
        confirm &&
        stored?.status !== "draft" &&
        stored?.confirmedFromVersion === version
      )
        return id;
      if (existing && existing.status === "settled")
        throw new Error(
          "Settled bets are locked; correct the settlement instead.",
        );
      if ((existing?.version ?? 0) !== version)
        throw new Error("This bet changed. Refresh before editing.");
      const status: Bet["status"] =
        confirm || existing?.status === "open" ? "open" : "draft";
      if (
        status === "open" &&
        !allowDuplicate &&
        input.reference &&
        ledger.bets.some(
          (bet) =>
            bet.ownerId === owner &&
            bet.id !== id &&
            bet.status !== "draft" &&
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
        id,
        ownerId: owner,
        status,
        version: version + 1,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        settlements: existing?.settlements ?? [],
        confirmedFromVersion:
          confirm && (!existing || existing.status === "draft")
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
      if (bet.settlements.some((item) => item.requestKey === input.requestKey))
        return bet.id;
      if (bet.status === "draft")
        throw new Error("Confirm the draft before settling.");
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
