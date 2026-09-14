import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_BADGE_VARIANT } from "@/lib/report-status";
import type { ReportStatus } from "@/types/report";

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
