// docs/16-API-CONTRACT.md §4 (Courses).

import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get()
  list(@Query() query: ListCoursesQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.coursesService.list(query, user?.sub);
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @CurrentUser() user?: JwtPayload) {
    return this.coursesService.getBySlug(slug, user?.sub);
  }

  @Post()
  @RequirePermissions('course:create')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(user.sub, dto);
  }

  // docs/16-API-CONTRACT.md: "owning instructor or content_editor/admin" —
  // ownership-OR-role, not a pure permission gate. Enforced in the service
  // (CoursesService.assertOwnerOrEditorial) rather than via @RequirePermissions,
  // since PermissionsGuard would incorrectly block an owning instructor who
  // doesn't separately hold the course:edit permission key.
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.coursesService.update(id, dto, user.sub, user.roles);
  }

  @HttpCode(200)
  @Post(':id/submit-review')
  submitForReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.submitForReview(id, user.sub);
  }

  @HttpCode(200)
  @Post(':id/publish')
  @RequirePermissions('course:publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.publish(id, user.sub);
  }

  // Same ownership-OR-role pattern as update() above — enforced in the service.
  @HttpCode(200)
  @Post(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.archive(id, user.sub, user.roles);
  }
}
