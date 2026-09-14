"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AchievementItem,
  BlockerItem,
  PaginatedResult,
  PlannedTaskItem,
  Report,
  ReportStatus,
  ReportTaskItem,
  TimeEntryItem,
} from "@/types/report";

export interface UpsertReportPayload {
  projectId: string;
  weekStart: string;
  weekEnd: string;
  notes?: string;
  tasks: ReportTaskItem[];
  plannedTasks: PlannedTaskItem[];
  blockers: BlockerItem[];
  achievements: AchievementItem[];
  timeEntries?: TimeEntryItem[];
}

export interface MyReportsQuery {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: ReportStatus;
}

export function useMyReports(query: MyReportsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["reports", "me", query],
    queryFn: () =>
      apiClient.get<PaginatedResult<Report>>("/reports/me", {
        page: query.page,
        limit: query.limit,
        projectId: query.projectId,
        status: query.status,
      }),
    enabled,
  });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => apiClient.get<Report>(`/reports/${id}`),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertReportPayload) => apiClient.post<Report>("/reports", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "me"] });
    },
  });
}

export function useUpdateReport(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertReportPayload) =>
      apiClient.patch<Report>(`/reports/${reportId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "me"] });
      queryClient.invalidateQueries({ queryKey: ["reports", reportId] });
    },
  });
}

export function useSubmitReport(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<Report>(`/reports/${reportId}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "me"] });
      queryClient.invalidateQueries({ queryKey: ["reports", reportId] });
    },
  });
}

/** Plain (non-hook) submit call, for flows where the id isn't known until after a create mutation resolves. */
export async function submitReportById(id: string): Promise<Report> {
  return apiClient.post<Report>(`/reports/${id}/submit`);
}
