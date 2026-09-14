"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useReport } from "@/hooks/use-reports";
import { ReportForm } from "@/components/reports/report-form/report-form";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ReportStatus } from "@/types/report";
import type { ReportFormValues } from "@/components/reports/report-form/form-schema";

const EDITABLE_STATUSES: string[] = [ReportStatus.DRAFT, ReportStatus.NEEDS_CORRECTION];

export default function EditReportPage() {
  const params = useParams<{ reportId: string }>();
  const { data: report, isLoading, isError } = useReport(params.reportId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6 md:p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
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

  if (!EDITABLE_STATUSES.includes(report.status)) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Report locked</h1>
          <ReportStatusBadge status={report.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          This report is {report.status === ReportStatus.SUBMITTED ? "awaiting review" : "approved"}{" "}
          and can no longer be edited.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/reports/${report.id}`}>View report</Link>
        </Button>
      </div>
    );
  }

  const latestCorrectionComment =
    report.status === ReportStatus.NEEDS_CORRECTION
      ? (report.reviews.find((r) => r.action === "CHANGES_REQUESTED")?.comment ?? null)
      : null;

  const defaultValues: Partial<ReportFormValues> = {
    projectId: report.projectId,
    weekStart: report.weekStart.slice(0, 10),
    weekEnd: report.weekEnd.slice(0, 10),
    notes: report.notes ?? "",
    tasks: report.tasks.map((t) => ({ ...t, deliverable: t.deliverable ?? "" })),
    plannedTasks: report.plannedTasks.map((t) => ({ ...t, description: t.description ?? "" })),
    blockers: report.blockers,
    achievements: report.achievements,
    timeEntries: report.timeEntries,
  };

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">Edit weekly report</h1>
        <ReportStatusBadge status={report.status} />
      </div>
      <ReportForm
        mode="edit"
        reportId={report.id}
        defaultValues={defaultValues}
        correctionComment={latestCorrectionComment}
      />
    </div>
  );
}
