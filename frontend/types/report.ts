export const ReportStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  NEEDS_CORRECTION: "NEEDS_CORRECTION",
  APPROVED: "APPROVED",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  BLOCKED: "BLOCKED",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TimeTaskType = {
  DEVELOPMENT: "DEVELOPMENT",
  TESTING: "TESTING",
  MEETINGS: "MEETINGS",
  DOCUMENTATION: "DOCUMENTATION",
  OTHER: "OTHER",
} as const;
export type TimeTaskType = (typeof TimeTaskType)[keyof typeof TimeTaskType];

export const ReviewAction = {
  APPROVED: "APPROVED",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
} as const;
export type ReviewAction = (typeof ReviewAction)[keyof typeof ReviewAction];

export interface Project {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

// Matches ProjectsService.getMembers()'s return shape exactly — a safe,
// minimal user projection (no role/createdAt, unlike ManagedUser), since
// this is "who's on this project", not a user-administration view.
export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface ReportTaskItem {
  id?: string;
  taskName: string;
  priority: TaskPriority;
  plannedPercentage: number;
  actualPercentage: number;
  status: TaskStatus;
  plannedHours: number;
  actualHours: number;
  deliverable?: string | null;
}

export interface PlannedTaskItem {
  id?: string;
  taskName: string;
  priority: TaskPriority;
  description?: string | null;
}

export interface BlockerItem {
  id?: string;
  description: string;
  isKeyIssue?: boolean;
}

export interface AchievementItem {
  id?: string;
  description: string;
  isKeyAchievement?: boolean;
}

export interface TimeEntryItem {
  id?: string;
  taskType: TimeTaskType;
  hours: number;
}

export interface ReportVersion {
  id: string;
  versionNumber: number;
  submittedAt: string;
  contentSnapshot: unknown;
}

export interface ReportReview {
  id: string;
  action: ReviewAction;
  comment: string | null;
  createdAt: string;
  reviewer?: { name: string };
}

export interface Report {
  id: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  projectId: string;
  project?: Project;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  notes: string | null;
  tasks: ReportTaskItem[];
  plannedTasks: PlannedTaskItem[];
  blockers: BlockerItem[];
  achievements: AchievementItem[];
  timeEntries: TimeEntryItem[];
  versions: ReportVersion[];
  reviews: ReportReview[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
