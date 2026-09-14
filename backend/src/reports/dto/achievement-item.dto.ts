import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class AchievementItemDto {
  @IsString()
  @MinLength(2, { message: 'Achievement description is required' })
  description: string;

  @IsOptional()
  @IsBoolean()
  isKeyAchievement?: boolean;
}
