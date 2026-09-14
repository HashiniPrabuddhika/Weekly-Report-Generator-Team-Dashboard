import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class BlockerItemDto {
  @IsString()
  @MinLength(2, { message: 'Blocker description is required' })
  description: string;

  @IsOptional()
  @IsBoolean()
  isKeyIssue?: boolean;
}
