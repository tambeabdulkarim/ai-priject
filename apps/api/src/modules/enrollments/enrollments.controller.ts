// docs/16-API-CONTRACT.md §6 (Enrollments).

import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { ListEnrollmentsQueryDto } from './dto/list-enrollments-query.dto';
import { RefundReasonDto } from './dto/refund-reason.dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.enroll(user.sub, dto.courseId);
  }

  @Get('me')
  listMine(@CurrentUser() user: JwtPayload, @Query() query: ListEnrollmentsQueryDto) {
    return this.enrollmentsService.listMine(user.sub, query);
  }

  // docs/16-API-CONTRACT.md: "Resource owner or enrollment:read" —
  // ownership-OR-permission, enforced in the service (same pattern as
  // CoursesController).
  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.enrollmentsService.getById(id, user.sub, user.roles);
  }

  @HttpCode(200)
  @Post(':id/refund')
  @RequirePermissions('order:refund')
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundReasonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.enrollmentsService.refund(id, dto.reason, user.sub);
  }
}
