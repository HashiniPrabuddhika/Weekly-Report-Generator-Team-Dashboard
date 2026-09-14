import { ReportStatus } from "@/types/report";

export const STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_CORRECTION: "Needs Correction",
  APPROVED: "Approved",
};

export const STATUS_BADGE_VARIANT: Record<
  ReportStatus,
  "draft" | "submitted" | "needsCorrection" | "approved"
> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  NEEDS_CORRECTION: "needsCorrection",
  APPROVED: "approved",
};
