"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useManagerReport } from "@/hooks/use-manager-reports";
import { ReportDetailView } from "@/components/reports/report-detail-view";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ReportStatus } from "@/types/report";

export default function ManagerReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const { data: report, isLoading, isError } = useManagerReport(params.reportId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6 md:p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <p className="text-sm text-muted-foreground">This report couldn&apos;t be loaded.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/manager/reports">Back to team reports</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {report.project?.name ?? "Weekly report"}
            </h1>
            <ReportStatusBadge status={report.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.user.name} &middot; {report.user.email}
          </p>
        </div>
        {report.status === ReportStatus.SUBMITTED && (
          <Button asChild>
            <Link href={`/manager/reports/${report.id}/review`}>Review</Link>
          </Button>
        )}
      </div>
      <ReportDetailView report={report} />
    </div>
  );
}
