"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Bot, CalendarCheck, ClipboardList, Columns3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WeekPicker } from "@/components/dashboard/week-picker";
import { SubmissionStatusChart } from "@/components/dashboard/submission-status-chart";
import { TaskTrendChart } from "@/components/dashboard/task-trend-chart";
import { WorkloadChart } from "@/components/dashboard/workload-chart";
import { TimeDistributionChart } from "@/components/dashboard/time-distribution-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useDashboardSummary } from "@/hooks/use-dashboard";

export default function ManagerDashboardPage() {
  const [week, setWeek] = React.useState<string | undefined>(undefined);
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(week);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        title="Team overview"
        description={
          summary
            ? `Showing the week of ${new Date(summary.week).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`
            : "Loading this week's overview…"
        }
        action={
          <div className="flex flex-wrap items-end gap-3">
            <WeekPicker value={week} onChange={setWeek} />
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager/dashboard/section-view">
                <Columns3 className="size-4" />
                Compare across team
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager/assistant">
                <Bot className="size-4" />
                Ask AI
              </Link>
            </Button>
          </div>
        }
      />

      {summaryLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Submitted this week"
            value={`${summary.totalSubmitted} / ${summary.totalTeamMembers}`}
            icon={ClipboardList}
          />
          <MetricCard
            label="Compliance rate"
            value={`${summary.complianceRate}%`}
            icon={CalendarCheck}
            tone={summary.complianceRate >= 80 ? "success" : "default"}
          />
          <MetricCard
            label="Needs correction"
            value={summary.needsCorrectionCount}
            icon={AlertTriangle}
            tone={summary.needsCorrectionCount > 0 ? "warning" : "default"}
          />
          <MetricCard
            label="Open blockers"
            value={summary.openBlockersCount}
            icon={Users}
            tone={summary.openBlockersCount > 0 ? "warning" : "default"}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SubmissionStatusChart week={week} />
        <TaskTrendChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WorkloadChart week={week} />
        <TimeDistributionChart week={week} />
      </div>

      <ActivityFeed />
    </div>
  );
}
