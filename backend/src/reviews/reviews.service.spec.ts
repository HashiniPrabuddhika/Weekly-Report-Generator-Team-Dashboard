import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { ReportStatus, ReviewAction } from '../reports/entities/report.enums';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;
  let reportsService: { findOneAny: jest.Mock };

  const submittedReport = {
    id: 'report-1',
    userId: 'user-A',
    status: ReportStatus.SUBMITTED,
  };

  beforeEach(async () => {
    prisma = {
      reportVersion: { findFirst: jest.fn() },
      reportReview: { create: jest.fn() },
      report: { update: jest.fn() },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    reportsService = { findOneAny: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReportsService, useValue: reportsService },
      ],
    }).compile();

    service = module.get(ReviewsService);
  });

  it('REJECTS reviewing a report that is not SUBMITTED (e.g. still DRAFT)', async () => {
    reportsService.findOneAny.mockResolvedValue({ ...submittedReport, status: ReportStatus.DRAFT });

    await expect(
      service.review('manager-1', 'report-1', { action: ReviewAction.APPROVED }),
    ).rejects.toThrow(BadRequestException);
  });

  it('REJECTS reviewing an already-APPROVED report', async () => {
    reportsService.findOneAny.mockResolvedValue({
      ...submittedReport,
      status: ReportStatus.APPROVED,
    });

    await expect(
      service.review('manager-1', 'report-1', { action: ReviewAction.APPROVED }),
    ).rejects.toThrow(BadRequestException);
  });

  it('REJECTS "request changes" with no comment, even if the DTO layer is bypassed', async () => {
    reportsService.findOneAny.mockResolvedValue(submittedReport);
    prisma.reportVersion.findFirst.mockResolvedValue({ id: 'version-1', versionNumber: 1 });

    await expect(
      service.review('manager-1', 'report-1', {
        action: ReviewAction.CHANGES_REQUESTED,
        comment: '   ', // whitespace-only, should still be rejected
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('approves a SUBMITTED report and moves status to APPROVED', async () => {
    reportsService.findOneAny.mockResolvedValue(submittedReport);
    prisma.reportVersion.findFirst.mockResolvedValue({ id: 'version-1', versionNumber: 1 });
    prisma.report.update.mockResolvedValue({ ...submittedReport, status: ReportStatus.APPROVED });

    await service.review('manager-1', 'report-1', { action: ReviewAction.APPROVED });

    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: ReportStatus.APPROVED } }),
    );
  });

  it('requesting changes moves status to NEEDS_CORRECTION and stores the comment', async () => {
    reportsService.findOneAny.mockResolvedValue(submittedReport);
    prisma.reportVersion.findFirst.mockResolvedValue({ id: 'version-1', versionNumber: 1 });
    prisma.report.update.mockResolvedValue({
      ...submittedReport,
      status: ReportStatus.NEEDS_CORRECTION,
    });

    await service.review('manager-1', 'report-1', {
      action: ReviewAction.CHANGES_REQUESTED,
      comment: 'Please add the actual deliverable link.',
    });

    expect(prisma.reportReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          comment: 'Please add the actual deliverable link.',
          versionId: 'version-1',
        }),
      }),
    );
    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: ReportStatus.NEEDS_CORRECTION } }),
    );
  });

  it('links the review to the LATEST version, not an earlier one', async () => {
    reportsService.findOneAny.mockResolvedValue(submittedReport);
    // Simulate a report that's already been through one correction cycle:
    // findFirst orderBy versionNumber desc should return the newest version.
    prisma.reportVersion.findFirst.mockResolvedValue({ id: 'version-2', versionNumber: 2 });
    prisma.report.update.mockResolvedValue({ ...submittedReport, status: ReportStatus.APPROVED });

    await service.review('manager-1', 'report-1', { action: ReviewAction.APPROVED });

    expect(prisma.reportReview.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ versionId: 'version-2' }) }),
    );
  });
});
