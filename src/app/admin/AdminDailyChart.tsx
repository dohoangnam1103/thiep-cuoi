"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyPoint } from "@/lib/admin-daily-stats";

type ValueFormat = "count" | "currency";

/**
 * Axis ticks are part of the server-rendered markup, so they are formatted with
 * plain arithmetic rather than `Intl`: a server and a browser disagreeing about
 * grouping separators would show up as a hydration mismatch. The tooltip never
 * renders until hover, so it can use `Intl` freely.
 */
function formatTick(value: number, format: ValueFormat): string {
  if (format === "count") return String(value);
  if (value >= 1_000_000) {
    return `${String(Math.round(value / 100_000) / 10).replace(".", ",")}tr`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function formatValue(value: number, format: ValueFormat): string {
  const formatted = new Intl.NumberFormat("vi-VN").format(value);
  return format === "currency" ? `${formatted}đ` : formatted;
}

/** Recharts hands the raw datum back untyped, so narrow it before reading. */
function pointOf(payload: unknown): DailyPoint | undefined {
  if (!Array.isArray(payload)) return undefined;
  const entry = payload[0] as { payload?: DailyPoint } | undefined;
  return entry?.payload;
}

export function AdminDailyChart({
  data,
  seriesLabel,
  color,
  format = "count",
}: {
  data: DailyPoint[];
  seriesLabel: string;
  /** A theme token, e.g. `var(--chart-1)`, so the bars follow the palette. */
  color: string;
  format?: ValueFormat;
}) {
  const config = {
    value: { label: seriesLabel, color },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
        // A 90-day window leaves roughly 5px per day, and the default category
        // gap spends most of it on whitespace, leaving hairline bars. `maxBarSize`
        // on the series keeps a 7-day window from turning into fat slabs.
        barCategoryGap="8%"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          // 90 days of labels do not fit; let Recharts thin them out instead of
          // overlapping, while keeping the first and last day visible.
          minTickGap={16}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={format === "currency" ? 48 : 32}
          tickFormatter={(value: number) => formatTick(value, format)}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label: unknown, payload: unknown) =>
                pointOf(payload)?.fullLabel ?? ""
              }
              formatter={(value: unknown) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{seriesLabel}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatValue(typeof value === "number" ? value : Number(value), format)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ChartContainer>
  );
}
