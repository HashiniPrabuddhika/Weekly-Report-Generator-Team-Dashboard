import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AiChatDto {
  @IsString()
  @MinLength(3, { message: 'Ask a slightly more specific question.' })
  @MaxLength(500)
  question: string;

  // The Monday of the week the question is about. Defaults to the current week.
  @IsOptional()
  @IsDateString()
  week?: string;
}
