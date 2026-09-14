import { IsDateString, IsOptional } from 'class-validator';

export class TeamSummaryQueryDto {
  @IsOptional()
  @IsDateString()
  week?: string;
}
