"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  DashboardSummary,
  SubmissionStatusRow,
  TaskTrendPoint,
  WorkloadByProject,
  TimeDistributionEntry,
  ActivityEvent,
  ReportSection,
  SectionViewResponse,
} from "@/types/dashboard";

export function useDashboardSummary(week?: string) {
  return useQuery({
    queryKey: ["dashboard", "summary", week],
    queryFn: () => apiClient.get<DashboardSummary>("/dashboard/summary", { week }),
  });
}

export function useSubmissionStatus(week?: string) {
  return useQuery({
    queryKey: ["dashboard", "submission-status", week],
    queryFn: () =>
      apiClient.get<SubmissionStatusRow[]>("/dashboard/submission-status", { week }),
  });
}

export function useTaskTrends() {
  return useQuery({
    queryKey: ["dashboard", "task-trends"],
    queryFn: () => apiClient.get<TaskTrendPoint[]>("/dashboard/task-trends"),
  });
}

export function useWorkloadByProject(week?: string) {
  return useQuery({
    queryKey: ["dashboard", "workload", week],
    queryFn: () => apiClient.get<WorkloadByProject[]>("/dashboard/workload", { week }),
  });
}

export function useTimeDistribution(week?: string) {
  return useQuery({
    queryKey: ["dashboard", "time-distribution", week],
    queryFn: () =>
      apiClient.get<TimeDistributionEntry[]>("/dashboard/time-distribution", { week }),
  });
}

export function useActivityFeed() {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => apiClient.get<ActivityEvent[]>("/dashboard/activity"),
  });
}

/**
 * Cross-team single-section view: one report section for every active
 * team member, side by side, for the given week. `enabled` guards the
 * request until a section has actually been picked, since `section` is
 * required by the backend (no sensible "all sections" default).
 */
export function useSectionView(week: string | undefined, section: ReportSection | undefined) {
  return useQuery({
    queryKey: ["dashboard", "section-view", week, section],
    queryFn: () =>
      apiClient.get<SectionViewResponse>("/dashboard/section-view", { week, section }),
    enabled: Boolean(section),
  });
}
