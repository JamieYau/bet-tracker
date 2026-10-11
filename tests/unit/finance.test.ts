import { describe, expect, it } from "vitest";
import { history, metrics } from "@/features/analytics/metrics";
import { exportCsv } from "@/features/bets/export";
import type { Bet, Settlement } from "@/features/bets/types";
import { betSchema, confirmedBetSchema } from "@/features/bets/validation";
import {
  cashProfit,
  currentSettlement,
  moneyToPence,
  ordinaryReturn,
  parseOdds,
} from "@/features/settlement/finance";
import { londonToUtc } from "@/lib/format";

const settlement = (changes: Partial<Settlement> = {}): Settlement => ({
  id: "s1",
  betId: "b1",
  revision: 1,
  outcome: "won",
  returnPence: 2500,
  settledAt: "2026-10-02T10:00:00Z",
  earlyPayout: false,
  reason: "",
  createdAt: "2026-10-02T10:00:00Z",
  requestKey: "r1",
  ...changes,
});
const bet = (changes: Partial<Bet> = {}): Bet => ({
  id: "b1",
  ownerId: "o",
  bookmakerId: "10000000-0000-4000-8000-000000000001",
  sourceId: "20000000-0000-4000-8000-000000000001",
  placedAt: "2026-09-30T10:00:00Z",
  sport: "Football",
  selection: "Home win",
  market: "Match result",
  acceptedOdds: "2.5",
  cashStakePence: 1000,
  freeStakePence: 0,
  freeStakeReturned: false,
  betType: "single",
  reference: "",
  notes: "",
  tags: [],
  legs: [],
  status: "settled",
  version: 2,
  createdAt: "2026-09-30T10:00:00Z",
  settlements: [settlement()],
  ...changes,
});
describe("exact financial calculations", () => {
  it("parses GBP to integer pence without floating-point rounding", () => {
    expect(moneyToPence("0.29")).toBe(29);
    expect(moneyToPence("12.50")).toBe(1250);
    expect(() => moneyToPence("1.005")).toThrow();
    expect(() => moneyToPence("-1")).toThrow();
  });
  it("accepts fractional odds and bounds decimal precision", () => {
    expect(parseOdds("3/2")).toBe("2.5");
    expect(parseOdds("1/3")).toBe("1.333333");
    expect(() => parseOdds("3/0")).toThrow();
    expect(() => parseOdds("0.5")).toThrow();
  });
  it.each([
    ["won", 2500],
    ["lost", 0],
    ["void", 1000],
    ["cash_out", null],
  ] as const)("prefills %s", (outcome, value) =>
    expect(ordinaryReturn(bet(), outcome)).toBe(value),
  );
  it("uses both free-bet stake-return rules and mixed funding", () => {
    expect(
      ordinaryReturn(bet({ cashStakePence: 0, freeStakePence: 1000 }), "won"),
    ).toBe(1500);
    expect(
      ordinaryReturn(
        bet({
          cashStakePence: 0,
          freeStakePence: 1000,
          freeStakeReturned: true,
        }),
        "won",
      ),
    ).toBe(2500);
    expect(ordinaryReturn(bet({ freeStakePence: 1000 }), "won")).toBe(4000);
  });
  it("a losing free bet has zero cash loss and void reinstated credit is not cash", () => {
    expect(
      cashProfit(
        bet({
          cashStakePence: 0,
          freeStakePence: 1000,
          settlements: [settlement({ outcome: "lost", returnPence: 0 })],
        }),
      ),
    ).toBe(0);
    expect(
      ordinaryReturn(bet({ cashStakePence: 0, freeStakePence: 1000 }), "void"),
    ).toBe(0);
  });
  it("rounds the combined return once to nearest penny", () =>
    expect(
      ordinaryReturn(
        bet({ cashStakePence: 1, freeStakePence: 1, acceptedOdds: "1.5" }),
        "won",
      ),
    ).toBe(2));
  it("uses accepted boosted/acca odds instead of leg odds", () => {
    expect(
      ordinaryReturn(
        bet({
          acceptedOdds: "8",
          betType: "acca",
          legs: [
            {
              id: "l",
              selection: "A",
              market: "",
              sport: "Football",
              odds: "2",
              status: "void",
            },
          ],
        }),
        "won",
      ),
    ).toBe(8000);
  });
  it("uses actual full cash-out and early-payout returns", () => {
    expect(
      cashProfit(
        bet({
          settlements: [settlement({ outcome: "cash_out", returnPence: 700 })],
        }),
      ),
    ).toBe(-300);
    expect(
      cashProfit(
        bet({
          settlements: [settlement({ earlyPayout: true, returnPence: 3000 })],
        }),
      ),
    ).toBe(2000);
  });
  it("only uses the latest correction even when history is out of order", () => {
    const value = bet({
      settlements: [
        settlement({ revision: 2, returnPence: 2000 }),
        settlement(),
      ],
    });
    expect(currentSettlement(value)?.revision).toBe(2);
    expect(cashProfit(value)).toBe(1000);
  });
  it("excludes drafts and open bets from P/L", () => {
    expect(cashProfit(bet({ status: "draft" }))).toBeNull();
    expect(cashProfit(bet({ status: "open" }))).toBeNull();
  });
});
describe("metrics and inputs", () => {
  it("reconciles bookmaker/source totals and promotional categories", () => {
    const bets = [
      bet(),
      bet({
        id: "b2",
        bookmakerId: "b",
        sourceId: "s",
        freeStakePence: 1000,
        settlements: [settlement({ returnPence: 0, outcome: "lost" })],
      }),
      bet({ id: "b3", status: "open", cashStakePence: 600, settlements: [] }),
      bet({
        id: "b4",
        settlements: [settlement({ outcome: "void", returnPence: 1000 })],
      }),
    ];
    const total = metrics(bets);
    expect(total.profit).toBe(500);
    expect(total.settledCount).toBe(3);
    expect(total.openExposure).toBe(600);
    expect(total.cashOnlyProfit + total.promotionalProfit).toBe(total.profit);
    expect(total.cashOnlyRoi).toBe(75);
    for (const key of ["bookmakerId", "sourceId"] as const) {
      const sum = [...new Set(bets.map((bet) => bet[key]))].reduce(
        (sum, id) =>
          sum + metrics(bets.filter((bet) => bet[key] === id)).profit,
        0,
      );
      expect(sum).toBe(total.profit);
    }
  });
  it("uses settlement dates for metrics and placement dates for history", () => {
    const value = bet();
    expect(metrics([value], { from: "2026-10-01" }).profit).toBe(1500);
    expect(history([value], { from: "2026-10-01" })).toHaveLength(0);
    expect(
      metrics([bet({ status: "open", settlements: [] })], {
        from: "2026-10-01",
      }).openExposure,
    ).toBe(1000);
  });
  it("retains valid incomplete drafts but rejects confirmation", () => {
    const value = bet({
      selection: "",
      sport: "",
      acceptedOdds: null,
      cashStakePence: 0,
    });
    expect(betSchema.safeParse(value).success).toBe(true);
    expect(confirmedBetSchema.safeParse(value).success).toBe(false);
  });
  it("rejects missing acca legs", () =>
    expect(confirmedBetSchema.safeParse(bet({ betType: "acca" })).success).toBe(
      false,
    ));
  it("converts London summer/winter times and rejects a missing DST time", () => {
    expect(londonToUtc("2026-07-01T12:00")).toBe("2026-07-01T11:00:00.000Z");
    expect(londonToUtc("2026-12-01T12:00")).toBe("2026-12-01T12:00:00.000Z");
    expect(() => londonToUtc("2026-03-29T01:30")).toThrow();
  });
  it("quotes CSV and neutralises spreadsheet formulas", () => {
    const value = bet({ selection: "=SUM(1,2)", notes: 'a "quote"' });
    const csv = exportCsv(
      [value],
      { bets: [value], bookmakers: [], sources: [] },
      "bets",
    );
    expect(csv).toContain("'=SUM(1,2)");
    expect(csv).toContain('a ""quote""');
  });
});
