import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { ReportStatus } from '../reports/entities/report.enums';
import { getStartOfWeek } from '../common/utils/date.util';
import { ReportSection } from './entities/report-section.enum';

// The nested `select` shape to pull for each section — kept minimal so the
// query only ever fetches the one relation it needs, not the whole report.
const SECTION_SELECT: Record<ReportSection, Record<string, unknown>> = {
  [ReportSection.TASKS_COMPLETED]: {
    tasks: {
      select: {
        id: true,
        taskName: true,
        priority: true,
        status: true,
        plannedPercentage: true,
        actualPercentage: true,
        plannedHours: true,
        actualHours: true,
        deliverable: true,
      },
    },
  },
  [ReportSection.PLANNED_TASKS]: {
    plannedTasks: {
      select: { id: true, taskName: true, priority: true, description: true },
    },
  },
  [ReportSection.BLOCKERS]: {
    blockers: { select: { id: true, description: true, isKeyIssue: true } },
  },
  [ReportSection.ACHIEVEMENTS]: {
    achievements: { select: { id: true, description: true, isKeyAchievement: true } },
  },
  [ReportSection.NOTES]: {
    notes: true,
  },
};

type SectionReport = {
  id: string;
  status: ReportStatus;
  project: { id: string; name: string };
  notes?: string | null;
  tasks?: Array<{
    id: string;
    taskName: string;
    priority: string;
    status: string;
    plannedPercentage: number;
    actualPercentage: number;
    plannedHours: number;
    actualHours: number;
    deliverable: string | null;
  }>;
  plannedTasks?: Array<{
    id: string;
    taskName: string;
    priority: string;
    description: string | null;
  }>;
  blockers?: Array<{ id: string; description: string; isKeyIssue: boolean }>;
  achievements?: Array<{ id: string; description: string; isKeyAchievement: boolean }>;
};

type SectionMember = {
  id: string;
  name: string;
  reports: SectionReport[];
};

export interface SectionViewMember {
  userId: string;
  name: string;
  reportId: string | null;
  reportStatus: ReportStatus | 'NOT_STARTED';
  projectName: string | null;
  /** Populated for TASKS_COMPLETED, PLANNED_TASKS, BLOCKERS, ACHIEVEMENTS. */
  items: unknown[];
  /** Populated only for the NOTES section (a single free-text field, not a list). */
  notes: string | null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Top-line metrics for the summary cards: submitted count, compliance
   * rate, reports needing correction, and open blockers — all for one week.
   */
  async getSummary(weekParam?: string) {
    const week = weekParam ? new Date(weekParam) : getStartOfWeek();

    const [totalActiveMembers, reportsThisWeek, needsCorrectionCount, openBlockersCount] =
      await Promise.all([
        this.prisma.user.count({ where: { role: Role.TEAM_MEMBER, isActive: true } }),
        this.prisma.report.findMany({
          where: { weekStart: week },
          select: { status: true },
        }),
        this.prisma.report.count({
          where: { weekStart: week, status: ReportStatus.NEEDS_CORRECTION },
        }),
        this.prisma.reportBlocker.count({
          where: { report: { weekStart: week } },
        }),
      ]);

    const submittedOrBeyondStatuses: ReportStatus[] = [
      ReportStatus.SUBMITTED,
      ReportStatus.NEEDS_CORRECTION,
      ReportStatus.APPROVED,
    ];
    const submittedOrBeyond = (reportsThisWeek as Array<{ status: ReportStatus }>).filter((r) =>
      submittedOrBeyondStatuses.includes(r.status),
    ).length;

    const complianceRate =
      totalActiveMembers === 0 ? 0 : Math.round((submittedOrBeyond / totalActiveMembers) * 100);

    return {
      week: week.toISOString(),
      totalSubmitted: submittedOrBeyond,
      totalTeamMembers: totalActiveMembers,
      pendingCount: Math.max(totalActiveMembers - reportsThisWeek.length, 0),
      complianceRate,
      needsCorrectionCount,
      openBlockersCount,
    };
  }

  /**
   * One row per active team member, showing their status for the given
   * week (or NOT_STARTED if they haven't created a report at all).
   */
  async getSubmissionStatusByMember(weekParam?: string) {
    const week = weekParam ? new Date(weekParam) : getStartOfWeek();

    const members = await this.prisma.user.findMany({
      where: { role: Role.TEAM_MEMBER, isActive: true },
      select: {
        id: true,
        name: true,
        reports: {
          where: { weekStart: week },
          select: { status: true },
        },
      },
    });

    type MemberWithWeekReport = {
      id: string;
      name: string;
      reports: Array<{ status: ReportStatus }>;
    };

    return (members as MemberWithWeekReport[]).map((m) => ({
      userId: m.id,
      name: m.name,
      status: m.reports[0]?.status ?? 'NOT_STARTED',
    }));
  }

  /**
   * Completed-task count per week, team-wide, over the last N weeks —
   * powers the "tasks completed trend" line chart.
   */
  async getTaskTrend(weeks = 8) {
    const since = new Date(getStartOfWeek());
    since.setUTCDate(since.getUTCDate() - 7 * (weeks - 1));

    const reports = await this.prisma.report.findMany({
      where: { weekStart: { gte: since } },
      select: {
        weekStart: true,
        tasks: { where: { status: 'COMPLETED' }, select: { id: true } },
      },
    });

    const byWeek = new Map<string, number>();
    for (const report of reports) {
      const key = report.weekStart.toISOString().slice(0, 10);
      byWeek.set(key, (byWeek.get(key) ?? 0) + report.tasks.length);
    }

    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, completedTasks]) => ({ week, completedTasks }));
  }

  /**
   * Task count per project for a given week (or all-time if omitted) —
   * powers the "workload by project" chart.
   */
  async getWorkloadByProject(weekParam?: string) {
    const reports = await this.prisma.report.findMany({
      where: weekParam ? { weekStart: new Date(weekParam) } : {},
      select: {
        projectId: true,
        project: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
    });

    const totals = new Map<string, { projectName: string; taskCount: number }>();
    for (const r of reports) {
      const existing = totals.get(r.projectId);
      const taskCount = r._count.tasks;
      if (existing) {
        existing.taskCount += taskCount;
      } else {
        totals.set(r.projectId, { projectName: r.project.name, taskCount });
      }
    }

    return Array.from(totals.values());
  }

  /**
   * Total hours per task type, team-wide, for a given week (or all-time) —
   * powers the "time distribution" chart.
   */
  async getTimeDistribution(weekParam?: string) {
    const where = weekParam ? { report: { weekStart: new Date(weekParam) } } : {};

    const grouped = await this.prisma.reportTimeEntry.groupBy({
      by: ['taskType'],
      where,
      _sum: { hours: true },
    });

    type TimeGroupResult = { taskType: string; _sum: { hours: number | null } };

    return (grouped as TimeGroupResult[]).map((g) => ({
      taskType: g.taskType,
      hours: g._sum.hours ?? 0,
    }));
  }

  /**
   * Recent activity feed: latest submissions and review actions, merged
   * and sorted by time — powers the dashboard's activity feed.
   */
  async getActivityFeed(limit = 15) {
    const [recentReviews, recentVersions] = await Promise.all([
      this.prisma.reportReview.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { name: true } },
          report: { select: { id: true, user: { select: { name: true } } } },
        },
      }),
      this.prisma.reportVersion.findMany({
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: { report: { select: { id: true, user: { select: { name: true } } } } },
      }),
    ]);

    type ReviewWithRelations = {
      createdAt: Date;
      action: string;
      reviewer: { name: string };
      report: { id: string; user: { name: string } };
    };
    type VersionWithRelations = {
      submittedAt: Date;
      versionNumber: number;
      report: { id: string; user: { name: string } };
    };

    const reviewEvents = (recentReviews as ReviewWithRelations[]).map((r) => ({
      type: 'review' as const,
      timestamp: r.createdAt,
      actorName: r.reviewer.name,
      subjectName: r.report.user.name,
      reportId: r.report.id,
      action: r.action,
    }));

    const submissionEvents = (recentVersions as VersionWithRelations[]).map((v) => ({
      type: 'submission' as const,
      timestamp: v.submittedAt,
      actorName: v.report.user.name,
      subjectName: v.report.user.name,
      reportId: v.report.id,
      versionNumber: v.versionNumber,
    }));

    return [...reviewEvents, ...submissionEvents]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Cross-team single-section view: for one chosen week and one chosen
   * report section (blockers, achievements, tasks, etc.), returns that
   * section's content for every active team member side by side — so a
   * manager can scan, say, every blocker across the team without opening
   * each report individually.
   *
   * Members who haven't created a report for the week are still included
   * (status NOT_STARTED, empty items) so the view always reflects the full
   * team, not just whoever has submitted.
   */
  async getSectionView(weekParam: string | undefined, section: ReportSection) {
    const week = weekParam ? new Date(weekParam) : getStartOfWeek();

    const members = await this.prisma.user.findMany({
      where: { role: Role.TEAM_MEMBER, isActive: true },
      select: {
        id: true,
        name: true,
        reports: {
          where: { weekStart: week },
          select: {
            id: true,
            status: true,
            project: { select: { id: true, name: true } },
            ...SECTION_SELECT[section],
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result: SectionViewMember[] = (members as SectionMember[]).map((member) => {
      const report = member.reports[0];

      const base = {
        userId: member.id,
        name: member.name,
        reportId: report?.id ?? null,
        reportStatus: report?.status ?? ('NOT_STARTED' as const),
        projectName: report?.project.name ?? null,
      };

      if (!report) {
        return { ...base, items: [], notes: null };
      }

      switch (section) {
        case ReportSection.NOTES:
          return { ...base, items: [], notes: report.notes ?? null };

        case ReportSection.BLOCKERS:
          return {
            ...base,
            notes: null,
            // Key issue surfaces first so a manager scanning the row sees it immediately.
            items: [...(report.blockers ?? [])].sort(
              (a, b) => Number(b.isKeyIssue) - Number(a.isKeyIssue),
            ),
          };

        case ReportSection.ACHIEVEMENTS:
          return {
            ...base,
            notes: null,
            items: [...(report.achievements ?? [])].sort(
              (a, b) => Number(b.isKeyAchievement) - Number(a.isKeyAchievement),
            ),
          };

        case ReportSection.PLANNED_TASKS:
          return { ...base, notes: null, items: report.plannedTasks ?? [] };

        case ReportSection.TASKS_COMPLETED:
        default:
          return { ...base, notes: null, items: report.tasks ?? [] };
      }
    });

    return {
      week: week.toISOString(),
      section,
      members: result,
    };
  }
}
