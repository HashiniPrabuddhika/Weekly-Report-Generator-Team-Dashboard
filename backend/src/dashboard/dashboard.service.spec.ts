import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '../reports/entities/report.enums';
import { ReportSection } from './entities/report-section.enum';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { count: jest.fn(), findMany: jest.fn() },
      report: { findMany: jest.fn(), count: jest.fn() },
      reportBlocker: { count: jest.fn() },
      reportTimeEntry: { groupBy: jest.fn() },
      reportReview: { findMany: jest.fn().mockResolvedValue([]) },
      reportVersion: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(DashboardService);
  });

  describe('getSummary', () => {
    it('computes compliance rate as (submitted-or-beyond / total active members) * 100', async () => {
      prisma.user.count.mockResolvedValue(5); // 5 active team members
      prisma.report.findMany.mockResolvedValue([
        { status: ReportStatus.SUBMITTED },
        { status: ReportStatus.APPROVED },
        { status: ReportStatus.NEEDS_CORRECTION },
        { status: ReportStatus.DRAFT }, // drafts don't count as "submitted"
      ]);
      prisma.report.count.mockResolvedValue(1); // needs-correction count
      prisma.reportBlocker.count.mockResolvedValue(2);

      const result = await service.getSummary('2026-09-07');

      // 3 of 5 members have submitted-or-beyond status -> 60%
      expect(result.totalSubmitted).toBe(3);
      expect(result.complianceRate).toBe(60);
      expect(result.needsCorrectionCount).toBe(1);
      expect(result.openBlockersCount).toBe(2);
    });

    it('returns 0% compliance (not NaN or a crash) when there are zero active members', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(0);
      prisma.reportBlocker.count.mockResolvedValue(0);

      const result = await service.getSummary('2026-09-07');
      expect(result.complianceRate).toBe(0);
    });
  });

  describe('getSubmissionStatusByMember', () => {
    it('reports NOT_STARTED for a member with no report that week', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', name: 'Hashini', reports: [{ status: ReportStatus.SUBMITTED }] },
        { id: 'user-2', name: 'Kasun', reports: [] }, // no report this week
      ]);

      const result = await service.getSubmissionStatusByMember('2026-09-07');

      expect(result).toEqual([
        { userId: 'user-1', name: 'Hashini', status: ReportStatus.SUBMITTED },
        { userId: 'user-2', name: 'Kasun', status: 'NOT_STARTED' },
      ]);
    });
  });

  describe('getTaskTrend', () => {
    it('buckets completed-task counts by week and sorts chronologically', async () => {
      prisma.report.findMany.mockResolvedValue([
        { weekStart: new Date('2026-08-24T00:00:00Z'), tasks: [{ id: 't1' }, { id: 't2' }] },
        { weekStart: new Date('2026-08-31T00:00:00Z'), tasks: [{ id: 't3' }] },
        { weekStart: new Date('2026-08-24T00:00:00Z'), tasks: [{ id: 't4' }] }, // same week, different report
      ]);

      const result = await service.getTaskTrend(2);

      expect(result).toEqual([
        { week: '2026-08-24', completedTasks: 3 }, // 2 + 1 merged correctly
        { week: '2026-08-31', completedTasks: 1 },
      ]);
    });
  });

  describe('getWorkloadByProject', () => {
    it('sums task counts across multiple reports for the same project', async () => {
      prisma.report.findMany.mockResolvedValue([
        { projectId: 'proj-1', project: { name: 'Client A' }, _count: { tasks: 4 } },
        { projectId: 'proj-1', project: { name: 'Client A' }, _count: { tasks: 2 } },
        { projectId: 'proj-2', project: { name: 'Internal' }, _count: { tasks: 3 } },
      ]);

      const result = await service.getWorkloadByProject();

      expect(result).toEqual(
        expect.arrayContaining([
          { projectName: 'Client A', taskCount: 6 },
          { projectName: 'Internal', taskCount: 3 },
        ]),
      );
    });
  });

  describe('getSectionView', () => {
    it('includes a member with NOT_STARTED status and empty items when they have no report that week', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'user-1', name: 'Kasun', reports: [] }]);

      const result = await service.getSectionView('2026-09-07', ReportSection.BLOCKERS);

      expect(result.members).toEqual([
        {
          userId: 'user-1',
          name: 'Kasun',
          reportId: null,
          reportStatus: 'NOT_STARTED',
          projectName: null,
          items: [],
          notes: null,
        },
      ]);
    });

    it('sorts blockers so the flagged key issue comes first', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          name: 'Hashini',
          reports: [
            {
              id: 'report-1',
              status: ReportStatus.SUBMITTED,
              project: { id: 'proj-1', name: 'Client A' },
              blockers: [
                { id: 'b1', description: 'Minor delay', isKeyIssue: false },
                { id: 'b2', description: 'Blocked on client API keys', isKeyIssue: true },
              ],
            },
          ],
        },
      ]);

      const result = await service.getSectionView('2026-09-07', ReportSection.BLOCKERS);

      expect(result.members[0].items).toEqual([
        { id: 'b2', description: 'Blocked on client API keys', isKeyIssue: true },
        { id: 'b1', description: 'Minor delay', isKeyIssue: false },
      ]);
      expect(result.members[0].projectName).toBe('Client A');
      expect(result.members[0].reportStatus).toBe(ReportStatus.SUBMITTED);
    });

    it('returns the notes string (not an items array) for the NOTES section', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          name: 'Hashini',
          reports: [
            {
              id: 'report-1',
              status: ReportStatus.APPROVED,
              project: { id: 'proj-1', name: 'Client A' },
              notes: 'Rolling off this project next sprint.',
            },
          ],
        },
      ]);

      const result = await service.getSectionView(undefined, ReportSection.NOTES);

      expect(result.members[0].notes).toBe('Rolling off this project next sprint.');
      expect(result.members[0].items).toEqual([]);
    });

    it('defaults to the current week when no week param is given', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.getSectionView(undefined, ReportSection.ACHIEVEMENTS);

      expect(result.section).toBe(ReportSection.ACHIEVEMENTS);
      expect(typeof result.week).toBe('string');
    });
  });
});
