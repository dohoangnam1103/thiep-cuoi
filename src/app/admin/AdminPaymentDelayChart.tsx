"use client";

import { Pie, PieChart } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PaymentDelayBucket, PaymentDelayPoint } from "@/lib/admin-payment-delay";

type ChartPoint = PaymentDelayPoint & { label: string };

const bucketColors: Record<PaymentDelayBucket, string> = {
  "day-0": "var(--chart-1)",
  "day-1": "var(--chart-2)",
  "day-2": "var(--chart-3)",
  "day-3-plus": "var(--chart-4)",
};

const bucketDotClasses: Record<PaymentDelayBucket, string> = {
  "day-0": "bg-[var(--chart-1)]",
  "day-1": "bg-[var(--chart-2)]",
  "day-2": "bg-[var(--chart-3)]",
  "day-3-plus": "bg-[var(--chart-4)]",
};

function pointOf(payload: unknown): ChartPoint | undefined {
  if (!Array.isArray(payload)) return undefined;
  const entry = payload[0] as { payload?: ChartPoint } | undefined;
  return entry?.payload;
}

export function AdminPaymentDelayChart({
  data,
  labels,
  seriesLabel,
}: {
  data: PaymentDelayPoint[];
  labels: Record<PaymentDelayBucket, string>;
  seriesLabel: string;
}) {
  const chartData = data.map((point) => ({
    ...point,
    label: labels[point.bucket],
    fill: bucketColors[point.bucket],
  }));
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const config = {
    value: { label: seriesLabel },
  } satisfies ChartConfig;

  return (
    <div>
      <div className="relative mx-auto max-w-md">
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">{seriesLabel}</span>
        </div>
        <ChartContainer config={config} className="relative z-10 aspect-auto h-60 w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_label: unknown, payload: unknown) =>
                    pointOf(payload)?.label ?? ""
                  }
                  formatter={(value: unknown, _name: unknown, item: unknown) => {
                    const point = pointOf([item]);
                    const count = typeof value === "number" ? value : Number(value);
                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{seriesLabel}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {count} ({point?.percentage.toFixed(1).replace(".", ",") ?? "0,0"}%)
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={64}
              outerRadius={102}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={3}
            />
          </PieChart>
        </ChartContainer>
      </div>
      <ul className="mx-auto mt-2 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {chartData.map((point) => (
          <li key={point.bucket} className="flex items-center gap-4">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className={`size-2.5 shrink-0 rounded-full ${bucketDotClasses[point.bucket]}`} />
              <span className="truncate">{point.label}</span>
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {point.value} · {point.percentage.toFixed(1).replace(".", ",")}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
