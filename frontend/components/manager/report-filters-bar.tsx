"use client";

import { getMondayOfWeek } from "@/lib/date-utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTeamMembers } from "@/hooks/use-team";
import { useProjects } from "@/hooks/use-projects";
import { STATUS_LABELS } from "@/lib/report-status";
import { ReportStatus } from "@/types/report";
import type { ManagerReportsQuery } from "@/hooks/use-manager-reports";

const ALL = "ALL";

interface ReportFiltersBarProps {
  value: ManagerReportsQuery;
  onChange: (next: ManagerReportsQuery) => void;
}

export function ReportFiltersBar({ value, onChange }: ReportFiltersBarProps) {
  const { data: members } = useTeamMembers();
  const { data: projects } = useProjects();

  const hasActiveFilters = Boolean(
    value.week || value.employeeId || value.projectId || value.status,
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="week-filter" className="text-xs font-medium text-muted-foreground">
          Week
        </label>
        <Input
          id="week-filter"
          type="date"
          className="w-40"
          value={value.week ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              week: e.target.value ? getMondayOfWeek(e.target.value) : undefined,
              page: 1,
            })
          }
        />
        {value.week && (
          <span className="text-xs text-muted-foreground">Week of {value.week}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Team member</label>
        <Select
          value={value.employeeId ?? ALL}
          onValueChange={(v) => onChange({ ...value, employeeId: v === ALL ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All members</SelectItem>
            {members?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Project</label>
        <Select
          value={value.projectId ?? ALL}
          onValueChange={(v) => onChange({ ...value, projectId: v === ALL ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All projects</SelectItem>
            {projects?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <Select
          value={value.status ?? ALL}
          onValueChange={(v) =>
            onChange({ ...value, status: v === ALL ? undefined : (v as ReportStatus), page: 1 })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.values(ReportStatus)
              .filter((status) => status !== ReportStatus.DRAFT)
              .map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ page: 1, limit: value.limit })}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
