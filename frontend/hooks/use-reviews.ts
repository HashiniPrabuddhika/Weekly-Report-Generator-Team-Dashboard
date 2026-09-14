"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ReviewAction, Report } from "@/types/report";

interface ReviewActionInput {
  action: ReviewAction;
  comment?: string;
}

export function useReviewReport(reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReviewActionInput) =>
      apiClient.post<Report>(`/reports/${reportId}/review`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["manager", "reports", reportId] });
    },
  });
}
