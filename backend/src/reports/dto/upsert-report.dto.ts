import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TaskItemDto } from './task-item.dto';
import { PlannedTaskItemDto } from './planned-task-item.dto';
import { BlockerItemDto } from './blocker-item.dto';
import { AchievementItemDto } from './achievement-item.dto';
import { TimeEntryDto } from './time-entry.dto';

export class UpsertReportDto {
  @IsUUID()
  projectId: string;

  @IsDateString({}, { message: 'weekStart must be a valid ISO date (e.g. 2026-09-07)' })
  weekStart: string;

  @IsDateString({}, { message: 'weekEnd must be a valid ISO date (e.g. 2026-09-13)' })
  weekEnd: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TaskItemDto)
  tasks: TaskItemDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PlannedTaskItemDto)
  plannedTasks: PlannedTaskItemDto[];

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BlockerItemDto)
  blockers: BlockerItemDto[];

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AchievementItemDto)
  achievements: AchievementItemDto[];

  // Optional per the assignment ("Hours worked... - optional")
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => TimeEntryDto)
  timeEntries?: TimeEntryDto[];
}
