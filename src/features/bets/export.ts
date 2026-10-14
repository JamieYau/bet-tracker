import { cashProfit, currentSettlement } from "@/features/settlement/finance";
import { inUnits, unitProfit } from "@/features/units/units";
import type { Bet, Ledger } from "./types";

function cell(value: unknown) {
  let text = String(value ?? "");
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportCsv(bets: Bet[], ledger: Ledger, kind: "bets" | "legs") {
  const rows: unknown[][] =
    kind === "legs"
      ? [
          [
            "bet_id",
            "leg_id",
            "position",
            "selection",
            "market",
            "sport",
            "decimal_odds",
            "status",
            "event",
            "direction",
            "line",
          ],
        ]
      : [
          [
            "bet_id",
            "bookmaker",
            "source",
            "placed_at_utc",
            "sport",
            "selection",
            "market",
            "decimal_odds",
            "cash_stake_pence",
            "free_stake_pence",
            "free_stake_returned",
            "bet_type",
            "status",
            "settled_at_utc",
            "credited_return_pence",
            "cash_pl_pence",
            "early_payout",
            "reference",
            "notes",
            "tags",
            "event",
            "direction",
            "line",
            "unit_size_pence",
            "cash_stake_units",
            "free_stake_units",
            "cash_pl_units",
          ],
        ];
  for (const bet of bets) {
    if (kind === "legs") {
      if (bet.betType !== "acca") continue;
      bet.legs.forEach((leg, index) => {
        rows.push([
          bet.id,
          leg.id,
          index + 1,
          leg.selection,
          leg.market,
          leg.sport,
          leg.odds,
          leg.status,
          leg.event ?? "",
          leg.direction ?? "",
          leg.line != null ? Number(leg.line) : "",
        ]);
      });
      continue;
    }
    const settlement = currentSettlement(bet);
    rows.push([
      bet.id,
      ledger.bookmakers.find((option) => option.id === bet.bookmakerId)?.name,
      ledger.sources.find((option) => option.id === bet.sourceId)?.name,
      bet.placedAt,
      bet.sport,
      bet.selection,
      bet.market,
      bet.acceptedOdds,
      bet.cashStakePence,
      bet.freeStakePence,
      bet.freeStakeReturned,
      bet.betType,
      settlement?.outcome ?? bet.status,
      settlement?.settledAt,
      settlement?.returnPence,
      cashProfit(bet),
      settlement?.earlyPayout,
      bet.reference,
      bet.notes,
      bet.tags.join("; "),
      bet.event ?? "",
      bet.direction ?? "",
      bet.line != null ? Number(bet.line) : "",
      bet.unitSizePence,
      inUnits(bet.cashStakePence, bet.unitSizePence),
      inUnits(bet.freeStakePence, bet.unitSizePence),
      unitProfit(bet),
    ]);
  }
  return `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}
