import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { ReviewActionDto } from './dto/review-action.dto';
import { ReportStatus, ReviewAction } from '../reports/entities/report.enums';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {}

  async review(reviewerId: string, reportId: string, dto: ReviewActionDto) {
    const report = await this.reportsService.findOneAny(reportId);

    if (report.status !== ReportStatus.SUBMITTED) {
      throw new BadRequestException(
        `Only reports with status SUBMITTED can be reviewed. This report is ${report.status}.`,
      );
    }

    // Defense in depth: the DTO already enforces this, but a manager-only
    // service method should never trust a single validation layer for a
    // rule this central to the workflow.
    if (dto.action === ReviewAction.CHANGES_REQUESTED && !dto.comment?.trim()) {
      throw new BadRequestException('A comment is required when requesting changes.');
    }

    // Every review must point at the exact version it was made against —
    // this is what lets a manager later see "this comment was about v2,
    // not the version currently on screen."
    const latestVersion = await this.prisma.reportVersion.findFirst({
      where: { reportId },
      orderBy: { versionNumber: 'desc' },
    });
    if (!latestVersion) {
      // Should be unreachable: a report can only reach SUBMITTED via
      // ReportsService.submit(), which always creates a version first.
      throw new BadRequestException('This report has no submitted version to review.');
    }

    const nextStatus =
      dto.action === ReviewAction.APPROVED ? ReportStatus.APPROVED : ReportStatus.NEEDS_CORRECTION;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.reportReview.create({
        data: {
          reportId,
          versionId: latestVersion.id,
          reviewerId,
          action: dto.action,
          comment: dto.comment,
        },
      });

      return tx.report.update({
        where: { id: reportId },
        data: { status: nextStatus },
        include: {
          project: true,
          reviews: { orderBy: { createdAt: 'desc' } },
          versions: { orderBy: { versionNumber: 'desc' } },
        },
      });
    });
  }
}
