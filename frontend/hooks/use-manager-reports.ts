"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResult, ReportStatus } from "@/types/report";
import type { ManagerReportListItem, ManagerReport } from "@/types/manager";

export interface ManagerReportsQuery {
  page?: number;
  limit?: number;
  /** ISO date (YYYY-MM-DD) — must be a Monday; see lib/date-utils.ts. */
  week?: string;
  employeeId?: string;
  projectId?: string;
  status?: ReportStatus;
}

export function useManagerReports(query: ManagerReportsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["manager", "reports", query],
    queryFn: () =>
      apiClient.get<PaginatedResult<ManagerReportListItem>>("/manager/reports", {
        page: query.page,
        limit: query.limit,
        week: query.week,
        employeeId: query.employeeId,
        projectId: query.projectId,
        status: query.status,
      }),
    enabled,
  });
}

/**
 * Full detail for one report, from the manager's side (GET /manager/reports/:id).
 * Returns the same shape as the member's own GET /reports/:id, so it's safe
 * to reuse <ReportDetailView> as-is on the manager's page.
 */
export function useManagerReport(id: string | undefined) {
  return useQuery({
    queryKey: ["manager", "reports", "detail", id],
    queryFn: () => apiClient.get<ManagerReport>(`/manager/reports/${id}`),
    enabled: !!id,
  });
}
