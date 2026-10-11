import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { isDemo } from "@/lib/config";
import { demoMutate, demoRead } from "@/lib/demo-store";
import type { Json } from "@/lib/supabase/database.types";
import { supabaseServer } from "@/lib/supabase/server";
import type { Bet, BetInput, Ledger, Settlement } from "./types";
import type { settlementSchema } from "./validation";

function dbError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
async function allRows<T>(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await query(offset, offset + 499);
    dbError(result.error);
    if (!result.data) throw new Error("Unable to read your ledger.");
    rows.push(...result.data);
    if (result.data.length < 500) return rows;
  }
}
export async function getLedger(): Promise<Ledger> {
  const owner = await requireOwner();
  if (isDemo()) {
    const ledger = await demoRead();
    return {
      ...ledger,
      bets: ledger.bets.filter((bet) => bet.ownerId === owner),
    };
  }
  const db = await supabaseServer();
  const [bets, legs, settlements, bookmakers, sources] = await Promise.all([
    allRows((from, to) =>
      db
        .from("bets")
        .select("*")
        .eq("owner_id", owner)
        .order("placed_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    allRows((from, to) =>
      db
        .from("legs")
        .select("*")
        .eq("owner_id", owner)
        .order("bet_id")
        .order("position")
        .range(from, to),
    ),
    allRows((from, to) =>
      db
        .from("settlements")
        .select("*")
        .eq("owner_id", owner)
        .order("bet_id")
        .order("revision")
        .range(from, to),
    ),
    allRows((from, to) =>
      db
        .from("bookmakers")
        .select("*")
        .eq("owner_id", owner)
        .order("name")
        .order("id")
        .range(from, to),
    ),
    allRows((from, to) =>
      db
        .from("sources")
        .select("*")
        .eq("owner_id", owner)
        .order("name")
        .order("id")
        .range(from, to),
    ),
  ]);
  return {
    bookmakers: bookmakers.map((row) => ({
      id: row.id,
      name: row.name,
      active: row.active,
    })),
    sources: sources.map((row) => ({
      id: row.id,
      name: row.name,
      active: row.active,
    })),
    bets: bets.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      bookmakerId: row.bookmaker_id,
      sourceId: row.source_id,
      placedAt: row.placed_at,
      sport: row.sport,
      selection: row.selection,
      market: row.market,
      acceptedOdds:
        row.accepted_odds === null ? null : String(row.accepted_odds),
      cashStakePence: row.cash_stake_pence,
      freeStakePence: row.free_stake_pence,
      freeStakeReturned: row.free_stake_returned,
      betType: row.bet_type as Bet["betType"],
      status: row.status as Bet["status"],
      reference: row.reference,
      notes: row.notes,
      tags: row.tags,
      version: row.version,
      createdAt: row.created_at,
      legs: legs
        .filter((leg) => leg.bet_id === row.id)
        .map((leg) => ({
          id: leg.id,
          selection: leg.selection,
          market: leg.market,
          sport: leg.sport,
          odds: leg.odds === null ? null : String(leg.odds),
          status: leg.status as Bet["legs"][number]["status"],
        })),
      settlements: settlements
        .filter((item) => item.bet_id === row.id)
        .map((item) => ({
          id: item.id,
          betId: item.bet_id,
          revision: item.revision,
          outcome: item.outcome as Settlement["outcome"],
          returnPence: item.return_pence,
          settledAt: item.settled_at,
          earlyPayout: item.early_payout,
          reason: item.reason,
          createdAt: item.created_at,
          requestKey: item.request_key,
        })),
    })),
  };
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
  const db = await supabaseServer();
  const result = await db.rpc("save_bet", {
    p_id: id,
    p_payload: input as unknown as Json,
    p_legs: input.legs as unknown as Json,
    p_confirm: confirm,
    p_expected_version: version,
    p_allow_duplicate: allowDuplicate,
  });
  dbError(result.error);
  return result.data ?? id;
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
  const db = await supabaseServer();
  const result = await db.rpc("settle_bet", {
    p_bet_id: input.betId,
    p_request_key: input.requestKey,
    p_expected_version: input.version,
    p_outcome: input.outcome,
    p_return_pence: input.returnPence,
    p_settled_at: input.settledAt,
    p_early_payout: input.earlyPayout,
    p_reason: input.reason,
  });
  dbError(result.error);
  return input.betId;
}
export async function saveOption(
  kind: "bookmakers" | "sources",
  id: string,
  name: string,
  active: boolean,
) {
  await requireOwner();
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
  const db = await supabaseServer();
  const result = await db.rpc("save_option", {
    p_kind: kind,
    p_id: id,
    p_name: name,
    p_active: active,
  });
  dbError(result.error);
  return result.data ?? id;
}
