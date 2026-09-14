import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChatMessageDto {
  @IsOptional()
  @IsDateString()
  week?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question: string;
}
