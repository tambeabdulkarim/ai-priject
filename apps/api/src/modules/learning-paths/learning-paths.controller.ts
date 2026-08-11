// docs/16-API-CONTRACT.md §20 (Learning Paths).

import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { ListLearningPathsQueryDto } from './dto/list-learning-paths-query.dto';
import { SetLearningPathCoursesDto } from './dto/set-learning-path-courses.dto';
import { UpdateLearningPathDto } from './dto/update-learning-path.dto';
import { LearningPathsService } from './learning-paths.service';

@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @Public()
  @Get()
  list(@Query() query: ListLearningPathsQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.learningPathsService.list(query, user?.sub);
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @CurrentUser() user?: JwtPayload) {
    return this.learningPathsService.getBySlug(slug, user?.sub);
  }

  @Post()
  @RequirePermissions('learning_path:create')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLearningPathDto) {
    return this.learningPathsService.create(user.sub, dto);
  }

  @Patch(':id')
  @RequirePermissions('learning_path:create')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLearningPathDto) {
    return this.learningPathsService.update(id, dto);
  }

  @HttpCode(200)
  @Post(':id/publish')
  @RequirePermissions('learning_path:publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.learningPathsService.publish(id, user.sub);
  }

  @Put(':id/courses')
  @RequirePermissions('learning_path:create')
  setCourses(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetLearningPathCoursesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.learningPathsService.setCourses(id, user.sub, dto);
  }
}
