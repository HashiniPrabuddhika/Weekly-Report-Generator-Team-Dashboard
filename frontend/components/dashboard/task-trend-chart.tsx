"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useTaskTrends } from "@/hooks/use-dashboard";
import { TrendingUp } from "lucide-react";

export function TaskTrendChart() {
  const { data, isLoading } = useTaskTrends();

  const chartData = (data ?? []).map((point) => ({
    week: new Date(point.week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    completedTasks: point.completedTasks,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks completed trend</CardTitle>
        <CardDescription>Team-wide, over the last few weeks.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No completed tasks yet"
            description="This fills in once the team starts logging completed tasks."
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ left: -16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
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
              <Line
                type="monotone"
                dataKey="completedTasks"
                name="Completed tasks"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-1)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
