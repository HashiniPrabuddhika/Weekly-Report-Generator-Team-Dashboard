"use client";

import Link from "next/link";
import { useState } from "react";
import { useMyReports } from "@/hooks/use-reports";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ReportStatus } from "@/types/report";

function formatWeek(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export default function ReportsHistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyReports({ page, limit: 10 });

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="My reports"
        description="Your weekly report history."
        action={
          <Button asChild>
            <Link href="/reports/new">
              <Plus className="size-4" />
              New report
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-muted-foreground">
                You haven&apos;t created any reports yet.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/reports/new">Create your first report</Link>
              </Button>
            </div>
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
                {data.data.map((report) => (
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
                            report.status === ReportStatus.DRAFT ||
                            report.status === ReportStatus.NEEDS_CORRECTION
                              ? `/reports/${report.id}/edit`
                              : `/reports/${report.id}`
                          }
                        >
                          {report.status === ReportStatus.DRAFT ? "Continue" : "View"}
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

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
