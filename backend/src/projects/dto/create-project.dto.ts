import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2, { message: 'Project name must be at least 2 characters' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
