"use client";

import { AlertCircle, FileQuestion, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import {
  ReportSection,
  type SectionViewMember,
  type SectionViewResponse,
  type SectionBlockerItem,
  type SectionAchievementItem,
  type SectionTaskItem,
  type SectionPlannedTaskItem,
} from "@/types/dashboard";
import type { ReportStatus } from "@/types/report";

interface SectionViewBoardProps {
  data: SectionViewResponse | undefined;
  isLoading: boolean;
}

/** Wraps ReportStatusBadge but also handles the NOT_STARTED pseudo-status,
 *  which is valid here (a member with no report for the week) but isn't
 *  one of the four real workflow statuses ReportStatusBadge knows about. */
function MemberStatusBadge({ status }: { status: SectionViewMember["reportStatus"] }) {
  if (status === "NOT_STARTED") {
    return <Badge variant="outline">Not started</Badge>;
  }
  return <ReportStatusBadge status={status as ReportStatus} />;
}

function BlockerList({ items }: { items: SectionBlockerItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No blockers reported.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2 text-sm">
          {item.isKeyIssue && (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-status-needs-correction" />
          )}
          <span className={item.isKeyIssue ? "font-medium text-foreground" : "text-foreground"}>
            {item.description}
          </span>
          {item.isKeyIssue && (
            <Badge variant="needsCorrection" className="ml-auto shrink-0">
              Key issue
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

function AchievementList({ items }: { items: SectionAchievementItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No achievements reported.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2 text-sm">
          {item.isKeyAchievement && (
            <Sparkles className="mt-0.5 size-4 shrink-0 text-status-approved" />
          )}
          <span
            className={item.isKeyAchievement ? "font-medium text-foreground" : "text-foreground"}
          >
            {item.description}
          </span>
          {item.isKeyAchievement && (
            <Badge variant="approved" className="ml-auto shrink-0">
              Key achievement
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

function TaskTable({ items }: { items: SectionTaskItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks logged.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-1.5 pr-3 font-medium">Task</th>
            <th className="py-1.5 pr-3 font-medium">Status</th>
            <th className="py-1.5 pr-3 font-medium">Planned % / Actual %</th>
            <th className="py-1.5 pr-3 font-medium">Hours (P / A)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((task) => (
            <tr key={task.id} className="border-b border-border/60 last:border-0">
              <td className="py-1.5 pr-3">{task.taskName}</td>
              <td className="py-1.5 pr-3 text-muted-foreground">{task.status}</td>
              <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">
                {task.plannedPercentage}% / {task.actualPercentage}%
              </td>
              <td className="py-1.5 pr-3 tabular-nums text-muted-foreground">
                {task.plannedHours} / {task.actualHours}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlannedTaskList({ items }: { items: SectionPlannedTaskItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing planned yet.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="text-sm">
          <span className="font-medium text-foreground">{item.taskName}</span>
          <span className="ml-1.5 text-xs text-muted-foreground">({item.priority})</span>
        </li>
      ))}
    </ul>
  );
}

function SectionContent({ member, section }: { member: SectionViewMember; section: ReportSection }) {
  if (!member.reportId) {
    return <p className="text-sm text-muted-foreground">No report submitted for this week.</p>;
  }

  switch (section) {
    case ReportSection.BLOCKERS:
      return <BlockerList items={member.items as SectionBlockerItem[]} />;
    case ReportSection.ACHIEVEMENTS:
      return <AchievementList items={member.items as SectionAchievementItem[]} />;
    case ReportSection.TASKS_COMPLETED:
      return <TaskTable items={member.items as SectionTaskItem[]} />;
    case ReportSection.PLANNED_TASKS:
      return <PlannedTaskList items={member.items as SectionPlannedTaskItem[]} />;
    case ReportSection.NOTES:
      return member.notes ? (
        <p className="whitespace-pre-wrap text-sm text-foreground">{member.notes}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No notes added.</p>
      );
    default:
      return null;
  }
}

// Tabular sections (tasks completed) read better full-width; everything
// else is compact enough to tile 3-up on desktop.
const FULL_WIDTH_SECTIONS: ReportSection[] = [ReportSection.TASKS_COMPLETED];

export function SectionViewBoard({ data, isLoading }: SectionViewBoardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Pick a section to get started"
        description="Choose a week and a report section above to see every team member's entry side by side."
      />
    );
  }

  if (data.members.length === 0) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="No active team members found"
        description="Add team members from User Management to see them here."
      />
    );
  }

  const fullWidth = FULL_WIDTH_SECTIONS.includes(data.section);

  return (
    <div className={fullWidth ? "flex flex-col gap-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
      {data.members.map((member) => (
        <Card key={member.userId} className="gap-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{member.name}</CardTitle>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {member.projectName ?? "No project assigned"}
                </p>
              </div>
              <MemberStatusBadge status={member.reportStatus} />
            </div>
          </CardHeader>
          <CardContent>
            <SectionContent member={member} section={data.section} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
