import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { TaskPriority, TaskStatus } from '../entities/report.enums';

export class TaskItemDto {
  @IsString()
  @MinLength(2, { message: 'Task name is required' })
  taskName: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsInt()
  @Min(0)
  @Max(100)
  plannedPercentage: number;

  @IsInt()
  @Min(0)
  @Max(100)
  actualPercentage: number;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsInt()
  @Min(0)
  plannedHours: number;

  @IsInt()
  @Min(0)
  actualHours: number;

  @IsOptional()
  @IsString()
  deliverable?: string;
}
