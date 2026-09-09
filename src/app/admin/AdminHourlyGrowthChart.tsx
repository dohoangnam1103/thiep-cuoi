"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { HourlyGrowthPoint } from "@/lib/admin-hourly-stats";

function pointOf(payload: unknown): HourlyGrowthPoint | undefined {
  if (!Array.isArray(payload)) return undefined;
  const entry = payload[0] as { payload?: HourlyGrowthPoint } | undefined;
  return entry?.payload;
}

export function AdminHourlyGrowthChart({
  data,
  usersLabel,
  invitationsLabel,
  averageUsersLabel,
  averageInvitationsLabel,
}: {
  data: HourlyGrowthPoint[];
  usersLabel: string;
  invitationsLabel: string;
  averageUsersLabel: string;
  averageInvitationsLabel: string;
}) {
  const config = {
    users: { label: usersLabel, color: "oklch(0.62 0.13 220)" },
    invitations: { label: invitationsLabel, color: "var(--chart-1)" },
    averageUsers: { label: averageUsersLabel, color: "oklch(0.62 0.13 220)" },
    averageInvitations: { label: averageInvitationsLabel, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <ComposedChart
        accessibilityLayer
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        barCategoryGap="18%"
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={14}
          interval="preserveStartEnd"
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={30} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label: unknown, payload: unknown) => {
                const point = pointOf(payload);
                return point ? `${point.label} · hôm nay` : "";
              }}
              formatter={(value: unknown, name: unknown) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {{
                      users: usersLabel,
                      invitations: invitationsLabel,
                      averageUsers: averageUsersLabel,
                      averageInvitations: averageInvitationsLabel,
                    }[String(name)] ?? String(name)}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {typeof value === "number"
                      ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)
                      : "—"}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="users" fill="var(--color-users)" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Bar dataKey="invitations" fill="var(--color-invitations)" radius={[3, 3, 0, 0]} maxBarSize={16} />
        <Line
          dataKey="averageUsers"
          type="monotone"
          stroke="var(--color-averageUsers)"
          strokeWidth={2}
          strokeDasharray="5 5"
          strokeOpacity={0.65}
          dot={false}
        />
        <Line
          dataKey="averageInvitations"
          type="monotone"
          stroke="var(--color-averageInvitations)"
          strokeWidth={2}
          strokeDasharray="2 6"
          strokeOpacity={0.65}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
