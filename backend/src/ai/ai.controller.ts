import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { TeamSummaryQueryDto } from './dto/team-summary-query.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

// Manager-only, same as the rest of the manager-facing surface — a team
// member's own report data is already visible to them directly; this
// endpoint's value (and its cost) is in the cross-team view.
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('team-summary')
  getTeamSummary(@Query() query: TeamSummaryQueryDto) {
    return this.aiService.getTeamSummary(query.week);
  }

  @Post('chat')
  chat(@Body() dto: ChatMessageDto) {
    return this.aiService.chat(dto.week, dto.question);
  }
}
