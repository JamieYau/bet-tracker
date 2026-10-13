import { formatInTimeZone } from "date-fns-tz";
import { ArrowUpRight, CircleCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { BetList } from "@/features/bets/bet-list";
import type { Ledger } from "@/features/bets/types";
import { dateTime, money, TIME_ZONE } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FilterForm } from "./filters";
import { type Filters, matchesDimensions, metrics } from "./metrics";
import { ProfitChart, type ProfitChartPoint } from "./profit-chart";

export function Dashboard({
  ledger,
  filters,
}: {
  ledger: Ledger;
  filters: Filters;
}) {
  const totals = metrics(ledger.bets, filters);
  const chartPoints: ProfitChartPoint[] = [
    {
      index: 0,
      dateLabel: "Start of selected period",
      axisLabel: "Start",
      value: 0,
    },
    ...totals.series.map((point, index) => ({
      index: index + 1,
      dateLabel: `${dateTime(point.date)}`,
      axisLabel: formatInTimeZone(point.date, TIME_ZONE, "d MMM"),
      value: point.value,
    })),
  ];
  const chartSummary = `Cumulative settled cash P/L: ${money(totals.profit)} across ${totals.settledCount} settled ${totals.settledCount === 1 ? "bet" : "bets"}. Start: £0.00.`;
  return (
    <>
      <PageHeading
        eyebrow="Overview"
        title="Your betting, at a glance"
        description="Actual returns. Clear totals. Keep track of what’s settled and what’s still in play."
      />
      <FilterForm
        ledger={ledger}
        filters={filters}
        dateLabel="Settlement dates"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Settled cash P/L",
            value: money(totals.profit),
            note: "Credited returns minus cash stakes",
            icon: ArrowUpRight,
          },
          {
            label: "Settled bets",
            value: String(totals.settledCount),
            note: `${money(totals.cashStakes)} settled cash stakes`,
            icon: CircleCheck,
          },
          {
            label: "Open cash exposure",
            value: money(totals.openExposure),
            note: "All placement dates · other filters apply",
            icon: Wallet,
          },
        ].map((item, index) => (
          <Card
            key={item.label}
            className={
              index === 0
                ? "border-primary/20 bg-primary text-primary-foreground"
                : ""
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "text-xs font-medium",
                    index === 0
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </p>
                <item.icon className="size-4 opacity-60" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">
                {item.value}
              </p>
              <p className="mt-3 text-xs opacity-75">{item.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cumulative cash P/L</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Settlement date · selected period starts at zero
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totals.series.length ? (
              <ProfitChart points={chartPoints} summary={chartSummary} />
            ) : (
              <Empty className="min-h-40 bg-muted/40 p-4">
                <EmptyHeader>
                  <EmptyTitle>No settlements in this period</EmptyTitle>
                  <EmptyDescription>
                    Your chart appears when a settled bet matches the filters.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              {[
                ["Cash-only P/L", money(totals.cashOnlyProfit)],
                [
                  "Cash-only ROI",
                  totals.cashOnlyRoi === null
                    ? "—"
                    : `${totals.cashOnlyRoi.toFixed(1)}%`,
                ],
                ["Free/mixed-funded cash P/L", money(totals.promotionalProfit)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              Cash-only ROI excludes bets with free-bet funding. The two P/L
              categories add up to your total.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Monthly P/L</CardTitle>
          </CardHeader>
          <CardContent>
            {totals.monthly.length ? (
              <dl className="space-y-3">
                {totals.monthly.map(([month, value]) => (
                  <div className="flex justify-between text-sm" key={month}>
                    <dt>{month}</dt>
                    <dd className="font-medium tabular-nums">{money(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <Empty className="p-3">
                <EmptyHeader>
                  <EmptyTitle>No monthly results</EmptyTitle>
                  <EmptyDescription>
                    No settled bets match this period.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
        {(
          [
            ["bookmakers", "By bookmaker"],
            ["sources", "By source"],
          ] as const
        ).map(([kind, title]) => (
          <Card key={kind}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {ledger[kind]
                  .filter((option) =>
                    ledger.bets.some(
                      (bet) =>
                        (kind === "bookmakers"
                          ? bet.bookmakerId
                          : bet.sourceId) === option.id,
                    ),
                  )
                  .map((option) => {
                    const grouped = metrics(
                      ledger.bets.filter(
                        (bet) =>
                          (kind === "bookmakers"
                            ? bet.bookmakerId
                            : bet.sourceId) === option.id,
                      ),
                      filters,
                    );
                    return (
                      <div
                        className="flex justify-between gap-3 text-sm"
                        key={option.id}
                      >
                        <dt className="text-muted-foreground">{option.name}</dt>
                        <dd className="font-medium tabular-nums">
                          {money(grouped.profit)}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
              {!ledger.bets.length && (
                <Empty className="p-3">
                  <EmptyHeader>
                    <EmptyTitle>No totals yet</EmptyTitle>
                    <EmptyDescription>
                      Your settled totals will appear here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 mb-4 flex justify-between">
        <h2 className="font-semibold">Recent bets · all placement dates</h2>
        <Link href="/bets" className="text-sm text-primary hover:underline">
          View all →
        </Link>
      </div>
      <BetList
        bets={ledger.bets
          .filter((bet) => matchesDimensions(bet, filters))
          .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
          .slice(0, 5)}
        ledger={ledger}
      />
    </>
  );
}
