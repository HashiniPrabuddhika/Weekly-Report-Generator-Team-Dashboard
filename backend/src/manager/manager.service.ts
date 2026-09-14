import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManagerReportsQueryDto } from './dto/manager-reports-query.dto';
import { PaginatedResult } from '../common/dto/pagination-query.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllReports(query: ManagerReportsQueryDto): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      ...(query.week ? { weekStart: new Date(query.week) } : {}),
      ...(query.employeeId ? { userId: query.employeeId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: [{ weekStart: 'desc' }, { user: { name: 'asc' } }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Team roster with lightweight aggregate stats — powers the team list page.
   */
  async findTeamMembers() {
    const members = await this.prisma.user.findMany({
      where: { role: Role.TEAM_MEMBER, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { reports: true },
        },
      },
    });

    return members;
  }

  /**
   * Full profile for one team member: their info plus their complete
   * report history — powers the "Team Member Profile" manager view.
   */
  async findTeamMemberProfile(userId: string) {
    const [user, reports, approvedCount, correctionCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      this.prisma.report.findMany({
        where: { userId },
        orderBy: { weekStart: 'desc' },
        include: { project: true },
      }),
      this.prisma.report.count({ where: { userId, status: 'APPROVED' } }),
      this.prisma.report.count({ where: { userId, status: 'NEEDS_CORRECTION' } }),
    ]);

    return {
      user,
      reports,
      stats: {
        totalReports: reports.length,
        approvedCount,
        correctionCount,
      },
    };
  }
}
