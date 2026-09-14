"use client";

import { useMyReports } from "@/hooks/use-reports";
import { useManagerReports } from "@/hooks/use-manager-reports";
import { useAuth } from "@/hooks/use-auth";
import { Role } from "@/types/auth";
import { ReportStatus } from "@/types/report";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  href: string;
}

/**
 * Deliberately real, not decorative: a team member sees their own reports
 * that need correction; a manager/admin sees reports currently awaiting
 * their review. No "mark as read" concept — the list simply reflects
 * current state, and clears itself as reports move out of that state.
 */
export function useNotifications(): { items: NotificationItem[]; isLoading: boolean } {
  const { user } = useAuth();
  const isManager = user?.role === Role.MANAGER || user?.role === Role.ADMIN;

  const memberQuery = useMyReports(
    { status: ReportStatus.NEEDS_CORRECTION, limit: 10 },
    !isManager,
  );
  const managerQuery = useManagerReports({ status: ReportStatus.SUBMITTED, limit: 10 }, isManager);

  if (isManager) {
    const items: NotificationItem[] = (managerQuery.data?.data ?? []).map((report) => ({
      id: report.id,
      title: `${report.user.name}'s report is awaiting review`,
      description: report.project?.name ?? "Weekly report",
      href: `/manager/reports/${report.id}`,
    }));
    return { items, isLoading: managerQuery.isLoading };
  }

  const items: NotificationItem[] = (memberQuery.data?.data ?? []).map((report) => ({
    id: report.id,
    title: "A report needs your correction",
    description: report.project?.name ?? "Weekly report",
    href: `/reports/${report.id}/edit`,
  }));
  return { items, isLoading: memberQuery.isLoading };
}
