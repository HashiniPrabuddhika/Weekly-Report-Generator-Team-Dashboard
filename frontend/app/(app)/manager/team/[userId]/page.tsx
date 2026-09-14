"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTeamMemberProfile } from "@/hooks/use-team";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportStatus } from "@/types/report";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatWeek(weekStart: string, weekEnd: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${new Date(weekStart).toLocaleDateString(undefined, opts)} – ${new Date(weekEnd).toLocaleDateString(undefined, opts)}`;
}

export default function TeamMemberProfilePage() {
  const params = useParams<{ userId: string }>();
  const { data, isLoading, isError } = useTeamMemberProfile(params.userId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6 md:p-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load this profile.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/manager/team">Back to team</Link>
        </Button>
      </div>
    );
  }

  const { user, reports, stats } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-12">
          <AvatarFallback className="text-base">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {stats.totalReports}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-status-approved tabular-nums">
              {stats.approvedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Corrections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-status-needs-correction tabular-nums">
              {stats.correctionCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No reports yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-foreground">
                      {formatWeek(report.weekStart, report.weekEnd)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.project?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ReportStatusBadge status={report.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={
                            report.status === ReportStatus.SUBMITTED
                              ? `/manager/reports/${report.id}/review`
                              : `/manager/reports/${report.id}`
                          }
                        >
                          {report.status === ReportStatus.SUBMITTED ? "Review" : "View"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
