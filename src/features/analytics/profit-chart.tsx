"use client";
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { units } from "@/features/units/units";
import { money } from "@/lib/format";

export type ProfitChartPoint = {
  index: number;
  dateLabel: string;
  axisLabel: string;
  value: number;
  cashValue?: number;
};
const config = {
  value: { label: "Cash P/L", color: "var(--chart-1)" },
} satisfies ChartConfig;
const axisMoney = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function ProfitChart({
  points,
  summary,
  mode = "gbp",
}: {
  points: ProfitChartPoint[];
  summary: string;
  mode?: "gbp" | "units";
}) {
  const summaryId = useId();
  return (
    <figure className="min-w-0">
      <ChartContainer
        config={config}
        className="h-64 w-full aspect-auto"
        initialDimension={{ width: 320, height: 256 }}
      >
        <AreaChart
          accessibilityLayer
          data={points}
          margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
          aria-label="Cumulative settled cash P/L"
          aria-describedby={summaryId}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            tick={{ fill: "var(--muted-foreground)" }}
            dataKey="index"
            tickLine={false}
            axisLine={false}
            minTickGap={40}
            tickMargin={10}
            interval="preserveStartEnd"
            tickFormatter={(index) => points[Number(index)]?.axisLabel ?? ""}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)" }}
            width={64}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              mode === "units"
                ? units(Number(value))
                : axisMoney.format(Number(value) / 100)
            }
            domain={([min, max]) =>
              min === max
                ? [
                    min - (mode === "units" ? 1 : 100),
                    max + (mode === "units" ? 1 : 100),
                  ]
                : [min, max]
            }
          />
          <ReferenceLine
            y={0}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.dateLabel ?? ""
                }
                formatter={(value, _name, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">Cash P/L</span>
                    <span className="font-medium tabular-nums">
                      {mode === "units" ? (
                        <>
                          {units(Number(value))}
                          <span className="block text-xs text-muted-foreground">
                            {money(item.payload.cashValue ?? 0)} for included
                            bets
                          </span>
                        </>
                      ) : (
                        money(Number(value))
                      )}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Area
            type="linear"
            dataKey="value"
            baseValue={0}
            fill="var(--color-value)"
            fillOpacity={0.16}
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      <figcaption
        id={summaryId}
        className="mt-3 text-xs leading-5 text-muted-foreground"
      >
        {summary}
      </figcaption>
    </figure>
  );
}
