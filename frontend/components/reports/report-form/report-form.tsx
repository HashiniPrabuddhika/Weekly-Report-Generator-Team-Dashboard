"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { useCreateReport, useUpdateReport, useSubmitReport, submitReportById } from "@/hooks/use-reports";
import {
  reportFormSchema,
  DEFAULT_REPORT_FORM_VALUES,
  type ReportFormValues,
} from "./form-schema";
import { BasicInfoSection } from "./basic-info-section";
import { TasksSection } from "./tasks-section";
import { PlannedTasksSection } from "./planned-tasks-section";
import { BlockersSection } from "./blockers-section";
import { AchievementsSection } from "./achievements-section";
import { TimeBreakdownSection } from "./time-breakdown-section";
import { NotesSection } from "./notes-section";
import { CorrectionCommentBanner } from "@/components/reports/correction-comment-banner";

interface ReportFormProps {
  mode: "create" | "edit";
  reportId?: string;
  defaultValues?: Partial<ReportFormValues>;
  correctionComment?: string | null;
}

export function ReportForm({ mode, reportId, defaultValues, correctionComment }: ReportFormProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = React.useState<"draft" | "submit" | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { ...DEFAULT_REPORT_FORM_VALUES, ...defaultValues },
  });

  const createReport = useCreateReport();
  const updateReport = useUpdateReport(reportId ?? "");
  const submitExisting = useSubmitReport(reportId ?? "");

  async function handleSaveDraft(values: ReportFormValues) {
    setPendingAction("draft");
    try {
      if (mode === "create") {
        const created = await createReport.mutateAsync(values);
        toast.success("Draft saved");
        router.replace(`/reports/${created.id}/edit`);
      } else if (reportId) {
        await updateReport.mutateAsync(values);
        toast.success("Draft saved");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the report.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSubmitForReview(values: ReportFormValues) {
    setPendingAction("submit");
    try {
      if (mode === "create") {
        const created = await createReport.mutateAsync(values);
        await submitReportById(created.id);
      } else if (reportId) {
        await updateReport.mutateAsync(values);
        await submitExisting.mutateAsync();
      }
      toast.success("Report submitted for review");
      router.push("/reports");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit the report.");
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = pendingAction !== null;

  return (
    <Form {...form}>
      <form className="space-y-6">
        {correctionComment && <CorrectionCommentBanner comment={correctionComment} />}

        <BasicInfoSection />
        <TasksSection />
        <PlannedTasksSection />
        <BlockersSection />
        <AchievementsSection />
        <TimeBreakdownSection />
        <NotesSection />

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={form.handleSubmit(handleSaveDraft)}
          >
            {pendingAction === "draft" ? "Saving..." : "Save draft"}
          </Button>
          <Button
            type="button"
            disabled={isBusy}
            onClick={form.handleSubmit(handleSubmitForReview)}
          >
            {pendingAction === "submit" ? "Submitting..." : "Submit for review"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
