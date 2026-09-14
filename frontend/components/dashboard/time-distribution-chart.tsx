"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useTimeDistribution } from "@/hooks/use-dashboard";
import { Clock } from "lucide-react";

interface TimeDistributionChartProps {
  week?: string;
}

const TASK_TYPE_LABELS: Record<string, string> = {
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  MEETINGS: "Meetings",
  DOCUMENTATION: "Documentation",
  OTHER: "Other",
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function TimeDistributionChart({ week }: TimeDistributionChartProps) {
  const { data, isLoading } = useTimeDistribution(week);

  const chartData = (data ?? []).map((entry) => ({
    name: TASK_TYPE_LABELS[entry.taskType] ?? entry.taskType,
    hours: entry.hours,
  }));
  const totalHours = chartData.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time spent by task type</CardTitle>
        <CardDescription>
          Team-wide{week ? " for this week" : " (all-time)"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-60 w-full" />
        ) : chartData.length === 0 || totalHours === 0 ? (
          <EmptyState icon={Clock} title="No hours logged yet" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="hours"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} hrs`, ""]}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
