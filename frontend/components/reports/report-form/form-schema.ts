import { z } from "zod";
import { TaskPriority, TaskStatus, TimeTaskType } from "@/types/report";

export const taskItemSchema = z.object({
  taskName: z.string().min(2, "Task name is required"),
  priority: z.enum(TaskPriority),
  plannedPercentage: z.number().int().min(0).max(100),
  actualPercentage: z.number().int().min(0).max(100),
  status: z.enum(TaskStatus),
  plannedHours: z.number().min(0),
  actualHours: z.number().min(0),
  deliverable: z.string().optional(),
});

export const plannedTaskItemSchema = z.object({
  taskName: z.string().min(2, "Task name is required"),
  priority: z.enum(TaskPriority),
  description: z.string().optional(),
});

export const blockerItemSchema = z.object({
  description: z.string().min(2, "Blocker description is required"),
  isKeyIssue: z.boolean().optional(),
});

export const achievementItemSchema = z.object({
  description: z.string().min(2, "Achievement description is required"),
  isKeyAchievement: z.boolean().optional(),
});

export const timeEntrySchema = z.object({
  taskType: z.enum(TimeTaskType),
  hours: z.number().min(0),
});

export const reportFormSchema = z
  .object({
    projectId: z.string().min(1, "Project is required"),
    weekStart: z.string().min(1, "Week start date is required"),
    weekEnd: z.string().min(1, "Week end date is required"),
    notes: z.string().optional(),
    tasks: z.array(taskItemSchema),
    plannedTasks: z.array(plannedTaskItemSchema),
    blockers: z.array(blockerItemSchema),
    achievements: z.array(achievementItemSchema),
    timeEntries: z.array(timeEntrySchema).optional(),
  })
  .refine((data) => data.blockers.filter((b) => b.isKeyIssue).length <= 1, {
    message: "Only one blocker can be flagged as the key issue",
    path: ["blockers"],
  })
  .refine((data) => data.achievements.filter((a) => a.isKeyAchievement).length <= 1, {
    message: "Only one achievement can be flagged as the key achievement",
    path: ["achievements"],
  });

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export const EMPTY_TASK: ReportFormValues["tasks"][number] = {
  taskName: "",
  priority: TaskPriority.MEDIUM,
  plannedPercentage: 0,
  actualPercentage: 0,
  status: TaskStatus.NOT_STARTED,
  plannedHours: 0,
  actualHours: 0,
  deliverable: "",
};

export const EMPTY_PLANNED_TASK: ReportFormValues["plannedTasks"][number] = {
  taskName: "",
  priority: TaskPriority.MEDIUM,
  description: "",
};

export const EMPTY_BLOCKER: ReportFormValues["blockers"][number] = {
  description: "",
  isKeyIssue: false,
};

export const EMPTY_ACHIEVEMENT: ReportFormValues["achievements"][number] = {
  description: "",
  isKeyAchievement: false,
};

export const EMPTY_TIME_ENTRY: NonNullable<ReportFormValues["timeEntries"]>[number] = {
  taskType: TimeTaskType.DEVELOPMENT,
  hours: 0,
};

export const DEFAULT_REPORT_FORM_VALUES: ReportFormValues = {
  projectId: "",
  weekStart: "",
  weekEnd: "",
  notes: "",
  tasks: [],
  plannedTasks: [],
  blockers: [],
  achievements: [],
  timeEntries: [],
};
