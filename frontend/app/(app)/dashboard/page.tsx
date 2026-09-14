"use client";

import Link from "next/link";
import { FilePlus, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMyReports } from "@/hooks/use-reports";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { CorrectionCommentBanner } from "@/components/reports/correction-comment-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ReportStatus } from "@/types/report";

function formatWeek(weekStart: string, weekEnd: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${new Date(weekStart).toLocaleDateString(undefined, opts)} – ${new Date(weekEnd).toLocaleDateString(undefined, opts)}`;
}

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useMyReports({ limit: 50 });

  const reports = data?.data ?? [];
  const counts = {
    draft: reports.filter((r) => r.status === ReportStatus.DRAFT).length,
    submitted: reports.filter((r) => r.status === ReportStatus.SUBMITTED).length,
    needsCorrection: reports.filter((r) => r.status === ReportStatus.NEEDS_CORRECTION).length,
    approved: reports.filter((r) => r.status === ReportStatus.APPROVED).length,
  };

  const needsAttention = reports.find((r) => r.status === ReportStatus.NEEDS_CORRECTION);
  const recentReports = reports.slice(0, 5);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Good to see you, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s where things stand.</p>
        </div>
        <Button asChild>
          <Link href="/reports/new">
            <FilePlus className="size-4" />
            New report
          </Link>
        </Button>
      </div>

      {needsAttention && (
        <Link href={`/reports/${needsAttention.id}/edit`}>
          <CorrectionCommentBanner
            comment={
              needsAttention.reviews.find((r) => r.action === "CHANGES_REQUESTED")?.comment ??
              "A manager requested changes on one of your reports."
            }
          />
        </Link>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground tabular-nums">
                {counts.draft}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-status-submitted tabular-nums">
                {counts.submitted}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Needs correction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-status-needs-correction tabular-nums">
                {counts.needsCorrection}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-status-approved tabular-nums">
                {counts.approved}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : recentReports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports yet"
              description="Create your first weekly report to get started."
              action={
                <Button asChild size="sm">
                  <Link href="/reports/new">Create report</Link>
                </Button>
              }
            />
          ) : (
            recentReports.map((report) => (
              <Link
                key={report.id}
                href={
                  report.status === ReportStatus.DRAFT ||
                  report.status === ReportStatus.NEEDS_CORRECTION
                    ? `/reports/${report.id}/edit`
                    : `/reports/${report.id}`
                }
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-secondary/40"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {formatWeek(report.weekStart, report.weekEnd)}
                  </p>
                  <p className="text-muted-foreground">{report.project?.name ?? "—"}</p>
                </div>
                <ReportStatusBadge status={report.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
