import { IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';
import { ReviewAction } from '../../reports/entities/report.enums';

export class ReviewActionDto {
  @IsEnum(ReviewAction)
  action: ReviewAction;

  // Required when requesting changes (the manager must explain what to fix).
  // Optional — but still validated as a string if provided — when approving.
  @ValidateIf((dto: ReviewActionDto) => dto.action === ReviewAction.CHANGES_REQUESTED)
  @IsString()
  @MinLength(5, {
    message: 'A comment of at least 5 characters is required when requesting changes',
  })
  comment?: string;
}
