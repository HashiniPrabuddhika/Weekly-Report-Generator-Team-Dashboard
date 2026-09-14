import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { SetProjectMembersDto } from './dto/set-project-members.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Any authenticated user can view the project list (needed for the report form dropdown)
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.projectsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  // Same read/write split as the rest of this controller: any authenticated
  // user can see who's on a project, only MANAGER/ADMIN can change it.
  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.projectsService.getMembers(id);
  }

  @Put(':id/members')
  @Roles(Role.MANAGER, Role.ADMIN)
  setMembers(@Param('id') id: string, @Body() dto: SetProjectMembersDto) {
    return this.projectsService.setMembers(id, dto.userIds);
  }
}
