import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Report } from "@/types/report";

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

const TASK_TYPE_LABELS: Record<string, string> = {
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  MEETINGS: "Meetings",
  DOCUMENTATION: "Documentation",
  OTHER: "Other",
};

export function ReportDetailView({ report }: { report: Report }) {
  const totalHours = report.timeEntries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tasks completed</CardTitle>
        </CardHeader>
        <CardContent>
          {report.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Planned %</TableHead>
                  <TableHead>Actual %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Planned hrs</TableHead>
                  <TableHead>Actual hrs</TableHead>
                  <TableHead>Deliverable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.tasks.map((task, i) => (
                  <TableRow key={task.id ?? i}>
                    <TableCell className="font-medium text-foreground">{task.taskName}</TableCell>
                    <TableCell>{PRIORITY_LABELS[task.priority]}</TableCell>
                    <TableCell className="tabular-nums">{task.plannedPercentage}%</TableCell>
                    <TableCell className="tabular-nums">{task.actualPercentage}%</TableCell>
                    <TableCell>{STATUS_LABELS[task.status]}</TableCell>
                    <TableCell className="tabular-nums">{task.plannedHours}</TableCell>
                    <TableCell className="tabular-nums">{task.actualHours}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.deliverable || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planned for next week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {report.plannedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing planned yet.</p>
          ) : (
            report.plannedTasks.map((task, i) => (
              <div key={task.id ?? i} className="rounded-md border border-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{task.taskName}</span>
                  <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
                </div>
                {task.description && (
                  <p className="mt-1 text-muted-foreground">{task.description}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blockers &amp; challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.blockers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blockers reported.</p>
            ) : (
              report.blockers.map((b, i) => (
                <div
                  key={b.id ?? i}
                  className={cn(
                    "rounded-md border p-3 text-sm",
                    b.isKeyIssue ? "border-status-needs-correction/40 bg-status-needs-correction-bg" : "border-border",
                  )}
                >
                  {b.isKeyIssue && (
                    <div className="mb-1 flex items-center gap-1 text-xs font-medium text-status-needs-correction">
                      <AlertTriangle className="size-3" />
                      Key issue
                    </div>
                  )}
                  <p className="text-foreground">{b.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements &amp; highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No achievements recorded.</p>
            ) : (
              report.achievements.map((a, i) => (
                <div
                  key={a.id ?? i}
                  className={cn(
                    "rounded-md border p-3 text-sm",
                    a.isKeyAchievement ? "border-accent/40 bg-accent/5" : "border-border",
                  )}
                >
                  {a.isKeyAchievement && (
                    <div className="mb-1 flex items-center gap-1 text-xs font-medium text-accent">
                      <Sparkles className="size-3" />
                      Key achievement
                    </div>
                  )}
                  <p className="text-foreground">{a.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {report.timeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hours by task type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.timeEntries.map((entry, i) => (
              <div key={entry.id ?? i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{TASK_TYPE_LABELS[entry.taskType]}</span>
                <span className="font-medium text-foreground tabular-nums">{entry.hours} hrs</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
              <span>Total</span>
              <span className="tabular-nums">{totalHours} hrs</span>
            </div>
          </CardContent>
        </Card>
      )}

      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-foreground">{report.notes}</p>
          </CardContent>
        </Card>
      )}

      {report.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review history</CardTitle>
            <CardDescription>Every review action taken on this report, most recent first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.reviews.map((review) => (
              <div key={review.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant={review.action === "APPROVED" ? "approved" : "needsCorrection"}>
                    {review.action === "APPROVED" ? "Approved" : "Changes requested"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {review.comment && <p className="mt-2 text-foreground">{review.comment}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {report.versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Version history</CardTitle>
            <CardDescription>
              Each time this report was submitted, a snapshot was saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
              >
                <span className="font-medium text-foreground">Version {version.versionNumber}</span>
                <span className="text-muted-foreground">
                  Submitted{" "}
                  {new Date(version.submittedAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
