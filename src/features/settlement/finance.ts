import Decimal from "decimal.js";
import type { Bet, BetInput, Outcome, Settlement } from "@/features/bets/types";

export const MAX_PENCE = 1_000_000_000;
export function moneyToPence(input: string): number {
  const value = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Enter an amount with at most two decimal places.");
  const pence = new Decimal(value).mul(100).toNumber();
  if (!Number.isSafeInteger(pence) || pence > MAX_PENCE)
    throw new Error("Amount is too large.");
  return pence;
}
export function parseOdds(input: string): string {
  const value = input.trim();
  let odds: Decimal;
  if (/^\d+\s*\/\s*\d+$/.test(value)) {
    const [a, b] = value.split("/").map((part) => new Decimal(part.trim()));
    if (b.isZero())
      throw new Error("Fractional odds need a non-zero denominator.");
    odds = a.div(b).plus(1);
  } else if (/^\d+(\.\d{1,6})?$/.test(value)) odds = new Decimal(value);
  else throw new Error("Enter decimal odds (2.50) or fractional odds (3/2).");
  if (!odds.isFinite() || odds.lt(1) || odds.gt(1_000_000))
    throw new Error("Odds must be between 1 and 1,000,000.");
  return odds.toDecimalPlaces(6, Decimal.ROUND_HALF_UP).toString();
}
export function ordinaryReturn(
  bet: Pick<
    BetInput,
    "acceptedOdds" | "cashStakePence" | "freeStakePence" | "freeStakeReturned"
  >,
  outcome: Outcome,
): number | null {
  if (outcome === "cash_out") return null;
  if (outcome === "lost") return 0;
  if (outcome === "void") return bet.cashStakePence;
  if (!bet.acceptedOdds) return null;
  const odds = new Decimal(bet.acceptedOdds);
  const value = odds
    .mul(bet.cashStakePence)
    .plus(odds.minus(bet.freeStakeReturned ? 0 : 1).mul(bet.freeStakePence));
  const pence = value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  if (!Number.isSafeInteger(pence) || pence > MAX_PENCE)
    throw new Error("Return is too large; check the stakes and odds.");
  return pence;
}
export function currentSettlement(
  bet: Pick<Bet, "settlements">,
): Settlement | undefined {
  return bet.settlements.reduce<Settlement | undefined>(
    (latest, next) =>
      !latest || next.revision > latest.revision ? next : latest,
    undefined,
  );
}
export function cashProfit(bet: Bet): number | null {
  if (bet.status !== "settled") return null;
  const settlement = currentSettlement(bet);
  return settlement ? settlement.returnPence - bet.cashStakePence : null;
}
