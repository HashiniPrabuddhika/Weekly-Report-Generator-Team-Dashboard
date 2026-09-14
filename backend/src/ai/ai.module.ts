import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenRouterClient } from './openrouter-client';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AiController],
  providers: [AiService, OpenRouterClient, AnalyticsService],
})
export class AiModule {}
