// These mirror the enums in prisma/schema.prisma exactly, using the same
// string-literal-union pattern as Role — see common/enums/role.enum.ts for why.

export const ReportStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  NEEDS_CORRECTION: 'NEEDS_CORRECTION',
  APPROVED: 'APPROVED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TimeTaskType = {
  DEVELOPMENT: 'DEVELOPMENT',
  TESTING: 'TESTING',
  MEETINGS: 'MEETINGS',
  DOCUMENTATION: 'DOCUMENTATION',
  OTHER: 'OTHER',
} as const;
export type TimeTaskType = (typeof TimeTaskType)[keyof typeof TimeTaskType];

export const ReviewAction = {
  APPROVED: 'APPROVED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
} as const;
export type ReviewAction = (typeof ReviewAction)[keyof typeof ReviewAction];
