import { formatInTimeZone } from "date-fns-tz";
import { normalizeMarket, normalizeSport } from "@/features/bets/catalog";
import type { Bet } from "@/features/bets/types";
import { cashProfit, currentSettlement } from "@/features/settlement/finance";
import { TIME_ZONE } from "@/lib/format";

export type Filters = {
  from?: string;
  to?: string;
  bookmaker?: string;
  source?: string;
  sport?: string;
  market?: string;
  event?: string;
  direction?: string;
  line?: string;
  inPlay?: string;
  type?: string;
  status?: string;
};
export function matchesDimensions(bet: Bet, filters: Filters) {
  const picks = bet.betType === "acca" ? bet.legs : [bet];
  const hasPickFilters =
    filters.sport ||
    filters.market ||
    filters.event ||
    filters.direction ||
    filters.line;
  const matchesPick =
    !hasPickFilters ||
    picks.some(
      (pick) =>
        (!filters.sport ||
          (filters.sport === "Mixed"
            ? normalizeSport(bet.sport) === "Mixed"
            : normalizeSport(pick.sport).toLowerCase() ===
              normalizeSport(filters.sport).toLowerCase())) &&
        (!filters.market ||
          normalizeMarket(pick.market).toLowerCase() ===
            normalizeMarket(filters.market).toLowerCase()) &&
        (!filters.event ||
          (pick.event ?? "")
            .toLowerCase()
            .includes(filters.event.toLowerCase())) &&
        (!filters.direction || pick.direction === filters.direction) &&
        (!filters.line ||
          (pick.line != null && Number(pick.line) === Number(filters.line))),
    ) ||
    ((picks.length === 0 || filters.sport === "Mixed") &&
      filters.sport &&
      !filters.market &&
      !filters.event &&
      !filters.direction &&
      !filters.line &&
      normalizeSport(bet.sport).toLowerCase() ===
        normalizeSport(filters.sport).toLowerCase());
  const inPlay = bet.tags.some((tag) => tag.toLowerCase() === "in-play");
  return (
    (!filters.bookmaker || bet.bookmakerId === filters.bookmaker) &&
    (!filters.source || bet.sourceId === filters.source) &&
    Boolean(matchesPick) &&
    (!filters.inPlay || (filters.inPlay === "yes" ? inPlay : !inPlay)) &&
    (!filters.type || bet.betType === filters.type) &&
    (!filters.status ||
      bet.status === filters.status ||
      currentSettlement(bet)?.outcome === filters.status)
  );
}
export function matchesDate(date: string, filters: Filters) {
  const day = formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd");
  return (
    (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to)
  );
}
export function history(bets: Bet[], filters: Filters) {
  return bets
    .filter(
      (bet) =>
        matchesDimensions(bet, filters) && matchesDate(bet.placedAt, filters),
    )
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}
export function metrics(bets: Bet[], filters: Filters = {}) {
  const selected = bets.filter((bet) => matchesDimensions(bet, filters));
  const dated = selected.flatMap((bet) => {
    const settlement = currentSettlement(bet);
    return bet.status === "settled" &&
      settlement &&
      matchesDate(settlement.settledAt, filters)
      ? [{ bet, settlement }]
      : [];
  });
  const settled = dated.map((item) => item.bet);
  const cashOnly = settled.filter((bet) => bet.freeStakePence === 0);
  const profit = (list: Bet[]) =>
    list.reduce((total, bet) => total + (cashProfit(bet) ?? 0), 0);
  const stakes = (list: Bet[]) =>
    list.reduce((total, bet) => total + bet.cashStakePence, 0);
  const monthly = new Map<string, number>();
  for (const { bet, settlement } of dated) {
    const month = formatInTimeZone(settlement.settledAt, TIME_ZONE, "yyyy-MM");
    monthly.set(month, (monthly.get(month) ?? 0) + (cashProfit(bet) ?? 0));
  }
  let cumulative = 0;
  const series = [...dated]
    .sort(
      (a, b) =>
        a.settlement.settledAt.localeCompare(b.settlement.settledAt) ||
        a.bet.id.localeCompare(b.bet.id),
    )
    .map(({ bet, settlement }) => {
      cumulative += cashProfit(bet) ?? 0;
      return { id: bet.id, date: settlement.settledAt, value: cumulative };
    });
  return {
    profit: profit(settled),
    settledCount: settled.length,
    cashStakes: stakes(settled),
    cashOnlyProfit: profit(cashOnly),
    promotionalProfit: profit(settled.filter((bet) => bet.freeStakePence > 0)),
    cashOnlyRoi: stakes(cashOnly)
      ? (profit(cashOnly) / stakes(cashOnly)) * 100
      : null,
    openExposure: stakes(selected.filter((bet) => bet.status === "open")),
    monthly: [...monthly].sort(([a], [b]) => a.localeCompare(b)),
    series,
  };
}
