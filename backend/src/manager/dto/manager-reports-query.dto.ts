import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ReportStatus } from '../../reports/entities/report.enums';

export class ManagerReportsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'week must be a valid ISO date (the Monday of the target week)' })
  week?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
