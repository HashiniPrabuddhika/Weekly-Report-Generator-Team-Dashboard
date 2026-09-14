"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useReport } from "@/hooks/use-reports";
import { ReportDetailView } from "@/components/reports/report-detail-view";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ReportStatus } from "@/types/report";

export default function ReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const { data: report, isLoading, isError } = useReport(params.reportId);

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
        <p className="text-sm text-muted-foreground">
          This report couldn&apos;t be loaded — it may not exist, or you may not have access to it.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/reports">Back to my reports</Link>
        </Button>
      </div>
    );
  }

  const canEdit =
    report.status === ReportStatus.DRAFT || report.status === ReportStatus.NEEDS_CORRECTION;

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            {report.project?.name ?? "Weekly report"}
          </h1>
          <ReportStatusBadge status={report.status} />
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/reports/${report.id}/edit`}>Edit report</Link>
          </Button>
        )}
      </div>
      <ReportDetailView report={report} />
    </div>
  );
}
