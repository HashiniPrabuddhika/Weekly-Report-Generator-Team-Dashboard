import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskPriority } from '../entities/report.enums';

export class PlannedTaskItemDto {
  @IsString()
  @MinLength(2, { message: 'Task name is required' })
  taskName: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsOptional()
  @IsString()
  description?: string;
}
