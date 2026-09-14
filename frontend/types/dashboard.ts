export interface DashboardSummary {
  week: string;
  totalSubmitted: number;
  totalTeamMembers: number;
  pendingCount: number;
  complianceRate: number;
  needsCorrectionCount: number;
  openBlockersCount: number;
}

export interface SubmissionStatusRow {
  userId: string;
  name: string;
  status: "DRAFT" | "SUBMITTED" | "NEEDS_CORRECTION" | "APPROVED" | "NOT_STARTED";
}

export interface TaskTrendPoint {
  week: string;
  completedTasks: number;
}

export interface WorkloadByProject {
  projectName: string;
  taskCount: number;
}

export interface TimeDistributionEntry {
  taskType: string;
  hours: number;
}

export interface ActivityEvent {
  type: "review" | "submission";
  timestamp: string;
  actorName: string;
  subjectName: string;
  reportId: string;
  action?: string;
  versionNumber?: number;
}

// ---------------------------------------------------------------------------
// Cross-team single-section view — one report section, every team member,
// side by side, for one week. Mirrors backend/src/dashboard/entities/
// report-section.enum.ts and DashboardService.getSectionView() exactly.
// ---------------------------------------------------------------------------

export const ReportSection = {
  TASKS_COMPLETED: "TASKS_COMPLETED",
  PLANNED_TASKS: "PLANNED_TASKS",
  BLOCKERS: "BLOCKERS",
  ACHIEVEMENTS: "ACHIEVEMENTS",
  NOTES: "NOTES",
} as const;
export type ReportSection = (typeof ReportSection)[keyof typeof ReportSection];

export const SECTION_LABELS: Record<ReportSection, string> = {
  TASKS_COMPLETED: "Tasks Completed",
  PLANNED_TASKS: "Planned for Next Week",
  BLOCKERS: "Blockers / Challenges",
  ACHIEVEMENTS: "Achievements / Highlights",
  NOTES: "Notes",
};

export interface SectionTaskItem {
  id: string;
  taskName: string;
  priority: string;
  status: string;
  plannedPercentage: number;
  actualPercentage: number;
  plannedHours: number;
  actualHours: number;
  deliverable: string | null;
}

export interface SectionPlannedTaskItem {
  id: string;
  taskName: string;
  priority: string;
  description: string | null;
}

export interface SectionBlockerItem {
  id: string;
  description: string;
  isKeyIssue: boolean;
}

export interface SectionAchievementItem {
  id: string;
  description: string;
  isKeyAchievement: boolean;
}

export type SectionItem =
  | SectionTaskItem
  | SectionPlannedTaskItem
  | SectionBlockerItem
  | SectionAchievementItem;

export interface SectionViewMember {
  userId: string;
  name: string;
  reportId: string | null;
  reportStatus: "DRAFT" | "SUBMITTED" | "NEEDS_CORRECTION" | "APPROVED" | "NOT_STARTED";
  projectName: string | null;
  items: SectionItem[];
  notes: string | null;
}

export interface SectionViewResponse {
  week: string;
  section: ReportSection;
  members: SectionViewMember[];
}
