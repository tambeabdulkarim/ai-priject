// docs/16-API-CONTRACT.md §21 (Projects).

import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { EvaluateSubmissionDto } from './dto/evaluate-submission.dto';
import { ListSubmissionsQueryDto } from './dto/list-submissions-query.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { ProjectsService } from './projects.service';

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get('courses/:courseId/projects')
  listForCourse(@Param('courseId', ParseUUIDPipe) courseId: string, @CurrentUser() user?: JwtPayload) {
    return this.projectsService.listForCourse(courseId, user?.sub);
  }

  @Public()
  @Get('projects/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getById(id);
  }

  // docs/16-API-CONTRACT.md: "owning instructor or content_editor/admin" —
  // ownership-OR-role, enforced in the service (same pattern as
  // CoursesController/LessonsController).
  @Post('courses/:courseId/projects')
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.create(courseId, user.sub, user.roles, dto);
  }

  @HttpCode(200)
  @Post('courses/:courseId/projects/:id/publish')
  publish(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.publish(courseId, id, user.sub, user.roles);
  }

  @Post('projects/:id/submissions')
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.submit(id, user.sub, dto);
  }

  @Get('projects/submissions/me')
  listMine(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.projectsService.listMine(user.sub, query.cursor, query.limit);
  }

  @Get('courses/:courseId/projects/submissions')
  listSubmissionsForCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: ListSubmissionsQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.listSubmissionsForCourse(courseId, user.sub, user.roles, query);
  }

  // docs/16-API-CONTRACT.md: "resource owner (submitting learner) or the
  // course's owning instructor or content_editor/admin/moderator
  // (read-only)" — enforced in the service.
  @Get('projects/submissions/:id')
  getSubmissionById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.getSubmissionById(id, user.sub, user.roles);
  }

  @Post('projects/submissions/:id/evaluate')
  evaluate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EvaluateSubmissionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.evaluateSubmission(id, user.sub, user.roles, dto);
  }
}
