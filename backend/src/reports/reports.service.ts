import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertReportDto } from './dto/upsert-report.dto';
import { MyReportsQueryDto } from './dto/my-reports-query.dto';
import { ReportWorkflowService } from './report-workflow.service';
import { ReportStatus } from './entities/report.enums';
import { PaginatedResult } from '../common/dto/pagination-query.dto';

const REPORT_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  project: true,
  tasks: true,
  plannedTasks: true,
  blockers: true,
  achievements: true,
  timeEntries: true,
  versions: { orderBy: { versionNumber: 'desc' as const } },
  reviews: {
    orderBy: { createdAt: 'desc' as const },
    include: { reviewer: { select: { name: true } } },
  },
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(userId: string, dto: UpsertReportDto) {
    try {
      return await this.prisma.report.create({
        data: {
          userId,
          projectId: dto.projectId,
          weekStart: new Date(dto.weekStart),
          weekEnd: new Date(dto.weekEnd),
          notes: dto.notes,
          status: ReportStatus.DRAFT,
          tasks: { create: dto.tasks },
          plannedTasks: { create: dto.plannedTasks },
          blockers: { create: dto.blockers },
          achievements: { create: dto.achievements },
          timeEntries: { create: dto.timeEntries ?? [] },
        },
        include: REPORT_INCLUDE,
      });
    } catch (error) {
      // Prisma unique constraint violation on (userId, weekStart)
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('You already have a report for this week.');
      }
      throw error;
    }
  }

  async findMine(userId: string, query: MyReportsQueryDto): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      userId,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { weekStart: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { project: true },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Fetches a report only if it belongs to the given user.
   * Returns 403 rather than 404 for a mismatched owner — this is the
   * exact behavior the assignment's RBAC test matrix checks for:
   * "Team Member A tries to access Team Member B's report → 403 Forbidden".
   */
  async findOneOwned(userId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: REPORT_INCLUDE,
    });

    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }
    if (report.userId !== userId) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return report;
  }

  /**
   * Fetches a report by id with no ownership restriction — used only by
   * manager-facing code (reviews, manager dashboard) where seeing every
   * team member's reports is the entire point. Team-member-facing routes
   * must always go through findOneOwned instead.
   */
  async findOneAny(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: REPORT_INCLUDE,
    });
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }
    return report;
  }

  async updateDraft(userId: string, reportId: string, dto: UpsertReportDto) {
    const report = await this.findOneOwned(userId, reportId);
    ReportWorkflowService.assertEditable(report.status);

    // Replace nested collections atomically: delete old rows, insert new ones.
    // Simpler and less error-prone than diffing individual rows for a form
    // that always submits its full current state.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.reportTask.deleteMany({ where: { reportId } });
      await tx.plannedTask.deleteMany({ where: { reportId } });
      await tx.reportBlocker.deleteMany({ where: { reportId } });
      await tx.reportAchievement.deleteMany({ where: { reportId } });
      await tx.reportTimeEntry.deleteMany({ where: { reportId } });

      return tx.report.update({
        where: { id: reportId },
        data: {
          projectId: dto.projectId,
          weekStart: new Date(dto.weekStart),
          weekEnd: new Date(dto.weekEnd),
          notes: dto.notes,
          tasks: { create: dto.tasks },
          plannedTasks: { create: dto.plannedTasks },
          blockers: { create: dto.blockers },
          achievements: { create: dto.achievements },
          timeEntries: { create: dto.timeEntries ?? [] },
        },
        include: REPORT_INCLUDE,
      });
    });
  }

  /**
   * Submits (or resubmits) a report: snapshots the full current content
   * into an immutable ReportVersion row, then flips status to SUBMITTED.
   * The snapshot is what powers the "view past versions" requirement —
   * editing after this point never touches what's already been submitted.
   */
  async submit(userId: string, reportId: string) {
    const report = await this.findOneOwned(userId, reportId);
    ReportWorkflowService.assertSubmittable(report.status);

    const latestVersion = await this.prisma.reportVersion.findFirst({
      where: { reportId },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    const snapshot = {
      projectId: report.projectId,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      notes: report.notes,
      tasks: report.tasks,
      plannedTasks: report.plannedTasks,
      blockers: report.blockers,
      achievements: report.achievements,
      timeEntries: report.timeEntries,
    };

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.reportVersion.create({
        data: {
          reportId,
          versionNumber: nextVersionNumber,
          contentSnapshot: snapshot,
        },
      });

      return tx.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.SUBMITTED },
        include: REPORT_INCLUDE,
      });
    });
  }
}
