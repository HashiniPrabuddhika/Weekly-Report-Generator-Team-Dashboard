import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewActionDto } from './dto/review-action.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.interface';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':id/review')
  @Roles(Role.MANAGER, Role.ADMIN)
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') reportId: string,
    @Body() dto: ReviewActionDto,
  ) {
    return this.reviewsService.review(user.userId, reportId, dto);
  }
}
