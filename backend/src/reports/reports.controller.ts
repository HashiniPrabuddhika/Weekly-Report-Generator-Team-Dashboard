import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { UpsertReportDto } from './dto/upsert-report.dto';
import { MyReportsQueryDto } from './dto/my-reports-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertReportDto) {
    return this.reportsService.createDraft(user.userId, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() query: MyReportsQueryDto) {
    return this.reportsService.findMine(user.userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reportsService.findOneOwned(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertReportDto,
  ) {
    return this.reportsService.updateDraft(user.userId, id, dto);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reportsService.submit(user.userId, id);
  }
}
