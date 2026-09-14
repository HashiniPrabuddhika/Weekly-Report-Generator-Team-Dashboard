import { BadRequestException } from '@nestjs/common';
import { ReportStatus } from './entities/report.enums';

/**
 * Centralizes the report status state machine so transition rules live in
 * exactly one place, instead of scattered `if (status === ...)` checks
 * across controllers and services.
 *
 * Allowed transitions:
 *   DRAFT             -> SUBMITTED
 *   NEEDS_CORRECTION  -> SUBMITTED   (resubmit)
 *   SUBMITTED         -> APPROVED            (manager action, see reviews module)
 *   SUBMITTED         -> NEEDS_CORRECTION    (manager action, see reviews module)
 *
 * Editable states (team member can change content): DRAFT, NEEDS_CORRECTION
 * Immutable states: SUBMITTED, APPROVED
 */
export class ReportWorkflowService {
  static readonly EDITABLE_STATUSES: ReportStatus[] = [
    ReportStatus.DRAFT,
    ReportStatus.NEEDS_CORRECTION,
  ];

  static assertEditable(status: ReportStatus) {
    if (!this.EDITABLE_STATUSES.includes(status)) {
      throw new BadRequestException(
        `A report with status ${status} cannot be edited. Only DRAFT or NEEDS_CORRECTION reports are editable.`,
      );
    }
  }

  static assertSubmittable(status: ReportStatus) {
    if (!this.EDITABLE_STATUSES.includes(status)) {
      throw new BadRequestException(
        `A report with status ${status} cannot be submitted. Only DRAFT or NEEDS_CORRECTION reports can be submitted.`,
      );
    }
  }
}
