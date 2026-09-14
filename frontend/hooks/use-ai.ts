"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ChatResponse, TeamSummaryResponse } from "@/types/ai";

/**
 * Both AI endpoints are triggered explicitly by the user (a button click),
 * never fetched automatically on mount — an LLM call has real latency and
 * cost, so nothing should fire one just because a component rendered.
 * useMutation captures that intent correctly; a useQuery here would need
 * `enabled: false` plus a manual refetch() to get the same behavior.
 */
export function useGenerateTeamSummary() {
  return useMutation({
    mutationFn: (week: string | undefined) =>
      apiClient.get<TeamSummaryResponse>("/ai/team-summary", { week }),
  });
}

export interface AskAiChatPayload {
  question: string;
  week?: string;
}

export function useAskAiChat() {
  return useMutation({
    mutationFn: (payload: AskAiChatPayload) => apiClient.post<ChatResponse>("/ai/chat", payload),
  });
}
