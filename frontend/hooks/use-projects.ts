"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Project, ProjectMember } from "@/types/report";

export interface UpsertProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateProjectPayload extends Partial<UpsertProjectPayload> {
  isActive?: boolean;
}

/**
 * `includeInactive` defaults to false so existing callers (e.g. the report
 * form's project dropdown) keep seeing only active projects with no change.
 * The projects management page is the one place that passes `true`.
 */
export function useProjects(includeInactive = false, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["projects", { includeInactive }],
    queryFn: () =>
      apiClient.get<Project[]>("/projects", {
        includeInactive: includeInactive ? "true" : undefined,
      }),
    enabled: options?.enabled,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertProjectPayload) => apiClient.post<Project>("/projects", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) =>
      apiClient.patch<Project>(`/projects/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

/** Soft-delete (deactivate) — see backend ProjectsService.remove(). */
export function useDeactivateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Project>(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

/** Reactivate a previously-deactivated project. */
export function useReactivateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch<Project>(`/projects/${id}`, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: () => apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`),
    enabled: Boolean(projectId),
  });
}

/** Replace-the-full-set: `userIds` becomes exactly this project's assigned members. */
export function useSetProjectMembers(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      apiClient.put<ProjectMember[]>(`/projects/${projectId}/members`, { userIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "members"] });
    },
  });
}
