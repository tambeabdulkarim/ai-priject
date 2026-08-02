// docs/16-API-CONTRACT.md §5 (Lessons).

import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';

@Controller()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Public()
  @Get('courses/:courseId/modules/:moduleId/lessons')
  listForModule(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ) {
    return this.lessonsService.listForModule(courseId, moduleId);
  }

  @Public()
  @Get('lessons/:id')
  getContent(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.getContent(id, user?.sub, user?.roles);
  }

  // Not documented in docs/16-API-CONTRACT.md — see create-module.dto.ts.
  @Post('courses/:courseId/modules')
  createModule(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateModuleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.createModule(courseId, dto, user.sub, user.roles);
  }

  @Patch('courses/:courseId/modules/:moduleId')
  updateModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: CreateModuleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.updateModule(moduleId, dto, user.sub, user.roles);
  }

  // docs/16-API-CONTRACT.md: "owning instructor / content_editor" —
  // ownership-OR-role, enforced in the service (see CoursesController for
  // the identical pattern).
  @Post('courses/:courseId/modules/:moduleId/lessons')
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.create(courseId, moduleId, dto, user.sub, user.roles);
  }

  @Patch('lessons/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.update(id, dto, user.sub, user.roles);
  }

  @HttpCode(200)
  @Post('courses/:courseId/modules/:moduleId/lessons/reorder')
  reorder(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: ReorderLessonsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.reorder(courseId, moduleId, dto, user.sub, user.roles);
  }
}
