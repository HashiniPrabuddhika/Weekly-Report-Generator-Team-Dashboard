"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileSearch } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { ReportFiltersBar } from "@/components/manager/report-filters-bar";
import { PaginationControls } from "@/components/common/pagination-controls";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useManagerReports, type ManagerReportsQuery } from "@/hooks/use-manager-reports";

const DEFAULT_QUERY: ManagerReportsQuery = { page: 1, limit: 20 };

export default function ManagerReportsPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState<ManagerReportsQuery>(DEFAULT_QUERY);
  const { data, isLoading, isError } = useManagerReports(query);

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Team reports"
        description="Every report submitted across the team. Open one to review it."
      />

      <div className="mb-6">
        <ReportFiltersBar value={query} onChange={setQuery} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load reports right now.</p>
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No reports match these filters"
          description="Try clearing a filter, or check back once the team has submitted reports for this week."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team member</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((report) => (
                <TableRow
                  key={report.id}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => router.push(`/manager/reports/${report.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/manager/reports/${report.id}`);
                  }}
                >
                  <TableCell className="font-medium text-foreground">
                    {report.user.name}
                  </TableCell>
                  <TableCell>{report.project?.name ?? "—"}</TableCell>
                  <TableCell>
                    {new Date(report.weekStart).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <ReportStatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(report.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4">
            <PaginationControls
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
