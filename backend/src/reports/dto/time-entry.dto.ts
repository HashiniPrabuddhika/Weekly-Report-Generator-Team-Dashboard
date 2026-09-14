import { IsEnum, IsNumber, Min } from 'class-validator';
import { TimeTaskType } from '../entities/report.enums';

export class TimeEntryDto {
  @IsEnum(TimeTaskType)
  taskType: TimeTaskType;

  @IsNumber()
  @Min(0)
  hours: number;
}
