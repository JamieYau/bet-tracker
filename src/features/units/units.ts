import Decimal from "decimal.js";
import type { Bet, UnitPreferences } from "@/features/bets/types";
import { cashProfit } from "@/features/settlement/finance";
import { money } from "@/lib/format";

export const defaultPreferences: UnitPreferences = {
  unitSizePence: null,
  displayMode: "gbp",
  version: 0,
};
export function inUnits(
  pence: number,
  unitSizePence: number | null | undefined,
) {
  return unitSizePence && unitSizePence > 0
    ? new Decimal(pence).div(unitSizePence).toNumber()
    : null;
}
export function unitProfit(bet: Bet) {
  const profit = cashProfit(bet);
  return profit === null ? null : inUnits(profit, bet.unitSizePence);
}
export function units(value: number | null) {
  return value === null
    ? "—"
    : `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value)}u`;
}
export function betAmount(pence: number, bet: Bet, mode: "gbp" | "units") {
  return mode === "units" && bet.unitSizePence
    ? units(inUnits(pence, bet.unitSizePence))
    : money(pence);
}
export function stakeHint(value: string, unitSizePence: number | null) {
  if (!unitSizePence) return "";
  const amount = /^\d+(\.\d{0,2})?$/.test(value)
    ? new Decimal(value).times(100).toNumber()
    : null;
  return `${amount === null ? "—" : units(inUnits(amount, unitSizePence))} · ${money(unitSizePence)} per unit`;
}
