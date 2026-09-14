import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { SectionViewQueryDto } from './dto/section-view-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSummary(query.week);
  }

  @Get('submission-status')
  getSubmissionStatus(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSubmissionStatusByMember(query.week);
  }

  @Get('task-trends')
  getTaskTrends() {
    return this.dashboardService.getTaskTrend();
  }

  @Get('workload')
  getWorkload(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getWorkloadByProject(query.week);
  }

  @Get('time-distribution')
  getTimeDistribution(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getTimeDistribution(query.week);
  }

  @Get('activity')
  getActivity() {
    return this.dashboardService.getActivityFeed();
  }

  // Cross-team single-section view: one section (blockers, achievements,
  // tasks completed, planned tasks, or notes) for every team member,
  // side by side, for the given week.
  @Get('section-view')
  getSectionView(@Query() query: SectionViewQueryDto) {
    return this.dashboardService.getSectionView(query.week, query.section);
  }
}
