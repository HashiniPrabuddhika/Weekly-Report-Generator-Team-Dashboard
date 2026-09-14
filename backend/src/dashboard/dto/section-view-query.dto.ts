import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ReportSection } from '../entities/report-section.enum';

export class SectionViewQueryDto {
  // The Monday of the target week. Defaults to the current week when omitted.
  @IsOptional()
  @IsDateString()
  week?: string;

  @IsEnum(ReportSection, {
    message: `section must be one of: ${Object.values(ReportSection).join(', ')}`,
  })
  section!: ReportSection;
}
