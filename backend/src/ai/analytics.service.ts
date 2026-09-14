import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { getStartOfWeek } from '../common/utils/date.util';
import { ReportStatus } from '../reports/entities/report.enums';

const MAX_LIST_ITEMS = 30;
const MAX_TEXT_LENGTH = 240;

function truncate(text: string): string {
  return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH)}…` : text;
}

export interface TeamWeekContext {
  week: string;
  totalTeamMembers: number;
  reportsSubmitted: number;
  notStartedMembers: string[];
  statusBreakdown: {
    draft: number;
    submitted: number;
    needsCorrection: number;
    approved: number;
  };
  blockers: Array<{ member: string; project: string; text: string; isKeyIssue: boolean }>;
  achievements: Array<{
    member: string;
    project: string;
    text: string;
    isKeyAchievement: boolean;
  }>;
  workloadByProject: Array<{ project: string; taskCount: number }>;
}
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeamWeekContext(weekParam?: string): Promise<TeamWeekContext> {
    const week = weekParam ? new Date(weekParam) : getStartOfWeek();

    interface WeekReport {
      userId: string;
      status: ReportStatus;
      user: { name: string };
      project: { name: string };
      blockers: { description: string; isKeyIssue: boolean }[];
      achievements: { description: string; isKeyAchievement: boolean }[];
      tasks: { taskName: string }[];
    }

    const [teamMembers, reports]: [{ id: string; name: string }[], WeekReport[]] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { role: Role.TEAM_MEMBER, isActive: true },
          select: { id: true, name: true },
        }),
        this.prisma.report.findMany({
          where: { weekStart: week },
          select: {
            userId: true,
            status: true,
            user: { select: { name: true } },
            project: { select: { name: true } },
            blockers: { select: { description: true, isKeyIssue: true } },
            achievements: { select: { description: true, isKeyAchievement: true } },
            tasks: { select: { taskName: true } },
          },
        }),
      ]);

    const reportedUserIds = new Set(reports.map((r) => r.userId));
    const notStartedMembers = teamMembers
      .filter((m) => !reportedUserIds.has(m.id))
      .map((m) => m.name);

    const blockers = reports
      .flatMap((r) =>
        r.blockers.map((b) => ({
          member: r.user.name,
          project: r.project.name,
          text: truncate(b.description),
          isKeyIssue: b.isKeyIssue,
        })),
      )
      .sort((a, b) => Number(b.isKeyIssue) - Number(a.isKeyIssue))
      .slice(0, MAX_LIST_ITEMS);

    const achievements = reports
      .flatMap((r) =>
        r.achievements.map((a) => ({
          member: r.user.name,
          project: r.project.name,
          text: truncate(a.description),
          isKeyAchievement: a.isKeyAchievement,
        })),
      )
      .sort((a, b) => Number(b.isKeyAchievement) - Number(a.isKeyAchievement))
      .slice(0, MAX_LIST_ITEMS);

    const taskCountByProject = new Map<string, number>();
    for (const r of reports) {
      taskCountByProject.set(
        r.project.name,
        (taskCountByProject.get(r.project.name) ?? 0) + r.tasks.length,
      );
    }

    return {
      week: week.toISOString().slice(0, 10),
      totalTeamMembers: teamMembers.length,
      reportsSubmitted: reports.length,
      notStartedMembers,
      statusBreakdown: {
        draft: reports.filter((r) => r.status === ReportStatus.DRAFT).length,
        submitted: reports.filter((r) => r.status === ReportStatus.SUBMITTED).length,
        needsCorrection: reports.filter((r) => r.status === ReportStatus.NEEDS_CORRECTION).length,
        approved: reports.filter((r) => r.status === ReportStatus.APPROVED).length,
      },
      blockers,
      achievements,
      workloadByProject: Array.from(taskCountByProject.entries()).map(([project, taskCount]) => ({
        project,
        taskCount,
      })),
    };
  }
}
