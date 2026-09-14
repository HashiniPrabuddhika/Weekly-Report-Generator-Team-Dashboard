import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
}

// Icon sits in a tinted chip whose color echoes the metric's tone — a
// small, functional signal (not decoration) that lets someone scanning
// the row pick out the cards that need attention before reading any text.
const TONE_CLASSES: Record<NonNullable<MetricCardProps["tone"]>, { value: string; chip: string }> = {
  default: { value: "text-foreground", chip: "bg-primary/10 text-primary" },
  warning: {
    value: "text-status-needs-correction",
    chip: "bg-status-needs-correction-bg text-status-needs-correction",
  },
  success: {
    value: "text-status-approved",
    chip: "bg-status-approved-bg text-status-approved",
  },
};

export function MetricCard({ label, value, icon: Icon, tone = "default" }: MetricCardProps) {
  const classes = TONE_CLASSES[tone];

  return (
    <Card>
      <CardContent className="flex items-center gap-4 px-5">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", classes.chip)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={cn("mt-0.5 text-2xl font-semibold tabular-nums", classes.value)}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
