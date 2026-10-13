import {
  marketOptions,
  normalizeMarket,
  normalizeSport,
} from "@/features/bets/catalog";
import type { Bet } from "@/features/bets/types";

export function filterMarketOptions(bets: Bet[], sport: string): string[] {
  const normalized = normalizeSport(sport);
  const picks = bets.flatMap<Pick<Bet, "sport" | "market">>((bet) => {
    if (normalized === "Mixed" && normalizeSport(bet.sport) !== "Mixed")
      return [];
    return bet.betType === "acca" ? bet.legs : [bet];
  });
  return [
    ...new Set([
      ...marketOptions(normalized),
      ...picks
        .filter(
          (pick) =>
            !normalized ||
            normalized === "Mixed" ||
            normalizeSport(pick.sport).toLowerCase() ===
              normalized.toLowerCase(),
        )
        .map((pick) => normalizeMarket(pick.market))
        .filter(Boolean),
    ]),
  ].sort();
}
