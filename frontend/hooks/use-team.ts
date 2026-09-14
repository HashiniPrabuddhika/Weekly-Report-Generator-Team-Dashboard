"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TeamMemberSummary, TeamMemberProfile } from "@/types/manager";

export function useTeamMembers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["manager", "team"],
    queryFn: () => apiClient.get<TeamMemberSummary[]>("/manager/team"),
    enabled: options?.enabled,
  });
}

export function useTeamMemberProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["manager", "team", userId],
    queryFn: () => apiClient.get<TeamMemberProfile>(`/manager/team/${userId}`),
    enabled: !!userId,
  });
}
