import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { z } from "zod";
import type { Database } from "../../lib/db/connection";
import {
  appAccounts,
  bets,
  bookmakers,
  legs,
  settlements,
  sources,
} from "../../lib/db/schema";
import { normalizeLedger } from "./normalize-ledger";
import type { BetInput, Ledger } from "./types";
import type { settlementSchema } from "./validation";

export async function readLedger(
  db: Database,
  owner: string,
  includeDeleted = false,
): Promise<Ledger> {
  const ledger = await db.transaction(
    async (tx) => {
      const [account] = await tx
        .select()
        .from(appAccounts)
        .where(eq(appAccounts.ownerId, owner));
      if (!account) throw new Error("Unauthorized");
      const rows = await tx
        .select()
        .from(bets)
        .where(
          and(
            eq(bets.ownerId, owner),
            includeDeleted ? undefined : isNull(bets.deletedAt),
          ),
        )
        .orderBy(desc(bets.placedAt), asc(bets.id));
      const legRows = await tx
        .select()
        .from(legs)
        .where(eq(legs.ownerId, owner))
        .orderBy(asc(legs.betId), asc(legs.position));
      const settlementRows = await tx
        .select()
        .from(settlements)
        .where(eq(settlements.ownerId, owner))
        .orderBy(asc(settlements.betId), asc(settlements.revision));
      const options = async (table: typeof bookmakers | typeof sources) =>
        (
          await tx
            .select()
            .from(table)
            .where(eq(table.ownerId, owner))
            .orderBy(asc(table.name))
        ).map((row) => ({ id: row.id, name: row.name, active: row.active }));
      return {
        bookmakers: await options(bookmakers),
        sources: await options(sources),
        bets: rows.map((row) => ({
          ...row,
          deletedAt: row.deletedAt?.toISOString() ?? null,
          placedAt: row.placedAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
          legs: legRows
            .filter((leg) => leg.betId === row.id)
            .map((leg) => ({
              id: leg.id,
              selection: leg.selection,
              market: leg.market,
              event: leg.event,
              direction: leg.direction,
              line: leg.line,
              sport: leg.sport,
              odds: leg.odds,
              status: leg.status,
            })),
          settlements: settlementRows
            .filter((item) => item.betId === row.id)
            .map((item) => ({
              ...item,
              settledAt: item.settledAt.toISOString(),
              createdAt: item.createdAt.toISOString(),
            })),
        })),
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
  return normalizeLedger(ledger);
}
async function write<T>(run: () => Promise<T>) {
  try {
    return await run();
  } catch (error) {
    const cause =
      error instanceof Error && "cause" in error ? error.cause : error;
    if (cause && typeof cause === "object" && "code" in cause) {
      if (
        cause.code === "P0001" &&
        "message" in cause &&
        typeof cause.message === "string"
      )
        throw new Error(cause.message);
      if (cause.code === "23505")
        throw new Error(
          "That name or request already exists. Refresh before retrying.",
        );
    }
    throw new Error(
      "Unable to save. Your entries are still here; please retry.",
    );
  }
}
export async function savePostgresBet(
  db: Database,
  owner: string,
  id: string,
  version: number,
  input: BetInput,
  confirm: boolean,
  allowDuplicate: boolean,
) {
  await write(() =>
    db.execute(
      sql`select public.save_bet(${owner}, ${id}::uuid, ${JSON.stringify(input)}::jsonb, ${JSON.stringify(input.legs)}::jsonb, ${confirm}, ${version}, ${allowDuplicate})`,
    ),
  );
  return id;
}
export async function settlePostgresBet(
  db: Database,
  owner: string,
  input: z.infer<typeof settlementSchema>,
) {
  await write(() =>
    db.execute(
      sql`select public.settle_bet(${owner}, ${input.betId}::uuid, ${input.requestKey}::uuid, ${input.version}, ${input.outcome}, ${input.returnPence}::bigint, ${input.settledAt}::timestamptz, ${input.earlyPayout}, ${input.reason})`,
    ),
  );
  return input.betId;
}
export async function savePostgresOption(
  db: Database,
  owner: string,
  kind: "bookmakers" | "sources",
  id: string,
  name: string,
  active: boolean,
) {
  await write(() =>
    db.execute(
      sql`select public.save_option(${owner}, ${kind}, ${id}::uuid, ${name}, ${active})`,
    ),
  );
  return id;
}

export async function setPostgresBetDeleted(
  db: Database,
  owner: string,
  id: string,
  version: number,
  deleted: boolean,
) {
  await write(() =>
    db.execute(
      sql`select public.set_bet_deleted(${owner}, ${id}::uuid, ${version}, ${deleted})`,
    ),
  );
  return id;
}
