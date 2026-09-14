import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from './entities/report.enums';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;

  const baseReport = {
    id: 'report-1',
    userId: 'user-A',
    projectId: 'proj-1',
    status: ReportStatus.DRAFT,
    weekStart: new Date('2026-09-07'),
    weekEnd: new Date('2026-09-13'),
    notes: null,
    tasks: [],
    plannedTasks: [],
    blockers: [],
    achievements: [],
    timeEntries: [],
  };

  beforeEach(async () => {
    prisma = {
      report: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      reportVersion: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      reportTask: { deleteMany: jest.fn() },
      plannedTask: { deleteMany: jest.fn() },
      reportBlocker: { deleteMany: jest.fn() },
      reportAchievement: { deleteMany: jest.fn() },
      reportTimeEntry: { deleteMany: jest.fn() },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('findOneOwned — the core RBAC guarantee', () => {
    it('returns the report when the requesting user is the owner', async () => {
      prisma.report.findUnique.mockResolvedValue(baseReport);
      const result = await service.findOneOwned('user-A', 'report-1');
      expect(result).toEqual(baseReport);
    });

    it('throws ForbiddenException when a DIFFERENT user requests it', async () => {
      prisma.report.findUnique.mockResolvedValue(baseReport); // owned by user-A
      await expect(service.findOneOwned('user-B', 'report-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the report does not exist at all', async () => {
      prisma.report.findUnique.mockResolvedValue(null);
      await expect(service.findOneOwned('user-A', 'ghost-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDraft — workflow guard', () => {
    it('allows editing a DRAFT report', async () => {
      prisma.report.findUnique.mockResolvedValue(baseReport);
      prisma.report.update.mockResolvedValue({ ...baseReport });

      await expect(
        service.updateDraft('user-A', 'report-1', {
          projectId: 'proj-1',
          weekStart: '2026-09-07',
          weekEnd: '2026-09-13',
          tasks: [],
          plannedTasks: [],
          blockers: [],
          achievements: [],
        }),
      ).resolves.toBeDefined();
    });

    it('allows editing a NEEDS_CORRECTION report', async () => {
      prisma.report.findUnique.mockResolvedValue({
        ...baseReport,
        status: ReportStatus.NEEDS_CORRECTION,
      });
      prisma.report.update.mockResolvedValue(baseReport);

      await expect(
        service.updateDraft('user-A', 'report-1', {
          projectId: 'proj-1',
          weekStart: '2026-09-07',
          weekEnd: '2026-09-13',
          tasks: [],
          plannedTasks: [],
          blockers: [],
          achievements: [],
        }),
      ).resolves.toBeDefined();
    });

    it('REJECTS editing a SUBMITTED report — content is locked once submitted', async () => {
      prisma.report.findUnique.mockResolvedValue({ ...baseReport, status: ReportStatus.SUBMITTED });

      await expect(
        service.updateDraft('user-A', 'report-1', {
          projectId: 'proj-1',
          weekStart: '2026-09-07',
          weekEnd: '2026-09-13',
          tasks: [],
          plannedTasks: [],
          blockers: [],
          achievements: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('REJECTS editing an APPROVED report', async () => {
      prisma.report.findUnique.mockResolvedValue({ ...baseReport, status: ReportStatus.APPROVED });

      await expect(
        service.updateDraft('user-A', 'report-1', {
          projectId: 'proj-1',
          weekStart: '2026-09-07',
          weekEnd: '2026-09-13',
          tasks: [],
          plannedTasks: [],
          blockers: [],
          achievements: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("a different user cannot edit someone else's draft", async () => {
      prisma.report.findUnique.mockResolvedValue(baseReport); // owned by user-A

      await expect(
        service.updateDraft('user-B', 'report-1', {
          projectId: 'proj-1',
          weekStart: '2026-09-07',
          weekEnd: '2026-09-13',
          tasks: [],
          plannedTasks: [],
          blockers: [],
          achievements: [],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submit', () => {
    it('creates version 1 on first submission', async () => {
      prisma.report.findUnique.mockResolvedValue(baseReport);
      prisma.reportVersion.findFirst.mockResolvedValue(null); // no prior versions
      prisma.report.update.mockResolvedValue({ ...baseReport, status: ReportStatus.SUBMITTED });

      await service.submit('user-A', 'report-1');

      expect(prisma.reportVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ versionNumber: 1 }) }),
      );
    });

    it('increments the version number on resubmission after correction', async () => {
      prisma.report.findUnique.mockResolvedValue({
        ...baseReport,
        status: ReportStatus.NEEDS_CORRECTION,
      });
      prisma.reportVersion.findFirst.mockResolvedValue({ versionNumber: 1 });
      prisma.report.update.mockResolvedValue({ ...baseReport, status: ReportStatus.SUBMITTED });

      await service.submit('user-A', 'report-1');

      expect(prisma.reportVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ versionNumber: 2 }) }),
      );
    });

    it('REJECTS submitting an already-APPROVED report', async () => {
      prisma.report.findUnique.mockResolvedValue({ ...baseReport, status: ReportStatus.APPROVED });

      await expect(service.submit('user-A', 'report-1')).rejects.toThrow(BadRequestException);
    });
  });
});
