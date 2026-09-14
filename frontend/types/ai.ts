export interface TeamWeekContext {
  week: string;
  totalTeamMembers: number;
  submittedCount: number;
  needsCorrectionCount: number;
  notStartedMembers: string[];
  blockers: Array<{ member: string; project: string; description: string; isKeyIssue: boolean }>;
  achievements: Array<{ member: string; project: string; description: string }>;
  workloadByProject: Array<{ project: string; taskCount: number }>;
  timeDistribution: Array<{ taskType: string; hours: number }>;
}

export interface TeamSummaryResponse {
  summary: string;
  generatedAt: string;
  basedOn: TeamWeekContext;
}

export interface ChatResponse {
  answer: string;
  basedOn: TeamWeekContext;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
