import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerReportsQueryDto } from './dto/manager-reports-query.dto';
import { ReportsService } from '../reports/reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
export class ManagerController {
  constructor(
    private readonly managerService: ManagerService,
    private readonly reportsService: ReportsService,
  ) {}

  @Get('reports')
  findAllReports(@Query() query: ManagerReportsQueryDto) {
    return this.managerService.findAllReports(query);
  }

  @Get('reports/:id')
  findOneReport(@Param('id') id: string) {
    return this.reportsService.findOneAny(id);
  }

  @Get('team')
  findTeamMembers() {
    return this.managerService.findTeamMembers();
  }

  @Get('team/:userId')
  findTeamMemberProfile(@Param('userId') userId: string) {
    return this.managerService.findTeamMemberProfile(userId);
  }
}
