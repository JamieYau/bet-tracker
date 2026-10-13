import { formatOdds } from "../../lib/format";
import { normalizeMarket, normalizeSport } from "./catalog";
import type { BetInput, Ledger, Leg } from "./types";

function normalizePick<
  T extends {
    sport: string;
    market: string;
    event?: string;
    direction?: "" | "over" | "under";
    line?: string | null;
  },
>(pick: T): T {
  return {
    ...pick,
    sport: normalizeSport(pick.sport),
    market: normalizeMarket(pick.market),
    event: pick.event ?? "",
    direction: pick.direction ?? "",
    line: pick.line ? formatOdds(pick.line) : null,
  };
}

export function normalizeLedger(ledger: Ledger): Ledger {
  return {
    ...ledger,
    bets: ledger.bets.map((bet) => ({
      ...normalizePick(bet),
      legs: bet.legs.map(normalizePick),
    })),
  };
}

// Legacy categories may be retained, but new entry must use a fixed category.
export function assertSports(input: BetInput, existing?: BetInput) {
  const check = (
    sport: string,
    previous: string | undefined,
    mixed: boolean,
  ) => {
    const normalized = normalizeSport(sport);
    if (
      !normalized ||
      [
        "NFL",
        "Football",
        "NCAAF",
        "WNBA",
        "Tennis",
        "NBA",
        ...(mixed ? ["Mixed"] : []),
      ].includes(normalized)
    )
      return;
    if (
      previous &&
      normalized.toLowerCase() === normalizeSport(previous).toLowerCase()
    )
      return;
    throw new Error(
      "Choose a sport from the list. Existing categories can be retained when editing.",
    );
  };
  const previousSport =
    existing?.legs.find(
      (leg) =>
        normalizeSport(leg.sport).toLowerCase() ===
        normalizeSport(input.sport).toLowerCase(),
    )?.sport ?? existing?.sport;
  check(input.sport, previousSport, input.betType === "acca");
  input.legs.forEach((leg: Leg) => {
    check(
      leg.sport,
      existing?.betType === "single"
        ? existing.sport
        : existing?.legs.find((old) => old.id === leg.id)?.sport,
      false,
    );
  });
}
