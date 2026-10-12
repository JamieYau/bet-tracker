"use client";
import { useId } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import { money } from "@/lib/format";

export type ProfitChartPoint = {
  index: number;
  dateLabel: string;
  axisLabel: string;
  value: number;
};
const config = {
  value: { label: "Cash P/L", color: "var(--primary)" },
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
}: {
  points: ProfitChartPoint[];
  summary: string;
}) {
  const summaryId = useId();
  return (
    <figure className="min-w-0">
      <ChartContainer
        config={config}
        className="h-64 w-full aspect-auto"
        initialDimension={{ width: 320, height: 256 }}
      >
        <LineChart
          accessibilityLayer
          data={points}
          margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
          aria-label="Cumulative settled cash P/L"
          aria-describedby={summaryId}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="index"
            tickLine={false}
            axisLine={false}
            minTickGap={40}
            tickMargin={10}
            interval="preserveStartEnd"
            tickFormatter={(index) => points[Number(index)]?.axisLabel ?? ""}
          />
          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => axisMoney.format(Number(value) / 100)}
            domain={([min, max]) =>
              min === max ? [min - 100, max + 100] : [min, max]
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
                formatter={(value) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">Cash P/L</span>
                    <span className="font-medium tabular-nums">
                      {money(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
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
