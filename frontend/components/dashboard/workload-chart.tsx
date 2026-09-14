"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useWorkloadByProject } from "@/hooks/use-dashboard";
import { FolderKanban } from "lucide-react";

interface WorkloadChartProps {
  week?: string;
}

// Cycled per bar so each project reads as a distinct category at a glance,
// rather than every bar rendering in the same single accent color.
const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function WorkloadChart({ week }: WorkloadChartProps) {
  const { data, isLoading } = useWorkloadByProject(week);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workload by project</CardTitle>
        <CardDescription>Task count per project{week ? " for this week" : " (all-time)"}.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data || data.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No tasks recorded yet" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ left: -16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="projectName"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="taskCount" name="Tasks" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {data.map((entry, index) => (
                  <Cell key={entry.projectName} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
