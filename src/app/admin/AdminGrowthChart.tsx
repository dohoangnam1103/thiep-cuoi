"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyPoint } from "@/lib/admin-daily-stats";

type GrowthPoint = {
  day: string;
  label: string;
  fullLabel: string;
  users: number;
  invitations: number;
};

function mergeSeries(users: DailyPoint[], invitations: DailyPoint[]): GrowthPoint[] {
  const invitationsByDay = new Map(invitations.map((point) => [point.day, point.value]));
  return users.map((point) => ({
    day: point.day,
    label: point.label,
    fullLabel: point.fullLabel,
    users: point.value,
    invitations: invitationsByDay.get(point.day) ?? 0,
  }));
}

function pointOf(payload: unknown): GrowthPoint | undefined {
  if (!Array.isArray(payload)) return undefined;
  const entry = payload[0] as { payload?: GrowthPoint } | undefined;
  return entry?.payload;
}

export function AdminGrowthChart({
  users,
  invitations,
  usersLabel,
  invitationsLabel,
}: {
  users: DailyPoint[];
  invitations: DailyPoint[];
  usersLabel: string;
  invitationsLabel: string;
}) {
  const data = mergeSeries(users, invitations);
  const config = {
    users: { label: usersLabel, color: "var(--chart-1)" },
    invitations: { label: invitationsLabel, color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <LineChart accessibilityLayer data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
          interval="preserveStartEnd"
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={32} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label: unknown, payload: unknown) =>
                pointOf(payload)?.fullLabel ?? ""
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="users"
          type="monotone"
          stroke="var(--color-users)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          dataKey="invitations"
          type="monotone"
          stroke="var(--color-invitations)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
