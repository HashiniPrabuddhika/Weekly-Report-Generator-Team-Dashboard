"use client";

import { ReportForm } from "@/components/reports/report-form/report-form";

export default function NewReportPage() {
  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">New weekly report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in each section below, then save as a draft or submit for review.
        </p>
      </div>
      <ReportForm mode="create" />
    </div>
  );
}
