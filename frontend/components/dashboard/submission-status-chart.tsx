"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useSubmissionStatus } from "@/hooks/use-dashboard";
import { Users } from "lucide-react";

interface SubmissionStatusChartProps {
  week?: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "var(--status-draft)",
  SUBMITTED: "var(--status-submitted)",
  NEEDS_CORRECTION: "var(--status-needs-correction)",
  APPROVED: "var(--status-approved)",
  NOT_STARTED: "var(--border)",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_CORRECTION: "Needs correction",
  APPROVED: "Approved",
  NOT_STARTED: "Not started",
};

// A single ordinal axis makes every status directly comparable at a glance —
// higher bars mean further along the review pipeline. Color (not height
// alone) communicates status, so the tooltip spells the status out in words.
const STATUS_TO_VALUE: Record<string, number> = {
  NOT_STARTED: 0,
  DRAFT: 1,
  SUBMITTED: 2,
  NEEDS_CORRECTION: 2,
  APPROVED: 3,
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; status: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{row.name}</p>
      <p className="text-muted-foreground">{STATUS_LABELS[row.status] ?? row.status}</p>
    </div>
  );
}

export function SubmissionStatusChart({ week }: SubmissionStatusChartProps) {
  const { data, isLoading } = useSubmissionStatus(week);

  const chartData = (data ?? []).map((row) => ({
    name: row.name,
    value: STATUS_TO_VALUE[row.status] ?? 0,
    status: row.status,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission status by team member</CardTitle>
        <CardDescription>Where each person&apos;s report stands this week.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState icon={Users} title="No active team members" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 40, 160)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" hide domain={[0, 3]} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.status] ?? "var(--chart-2)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartData.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                />
                {label}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
