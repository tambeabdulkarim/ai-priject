// docs/16-API-CONTRACT.md §16 (News).

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CreateNewsDto } from './dto/create-news.dto';
import { ListNewsQueryDto } from './dto/list-news-query.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Public()
  @Get()
  list(@Query() query: ListNewsQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.newsService.list(query, user?.roles);
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @CurrentUser() user?: JwtPayload) {
    return this.newsService.getBySlug(slug, user?.roles);
  }

  @Post()
  @RequirePermissions('news:create')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateNewsDto) {
    return this.newsService.create(user.sub, dto);
  }

  // docs/16-API-CONTRACT.md: "news:edit (author/content_editor/admin)" —
  // ownership-OR-role, enforced in the service (same pattern as CoursesController).
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNewsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.newsService.update(id, dto, user.sub, user.roles);
  }

  @HttpCode(200)
  @Post(':id/publish')
  @RequirePermissions('news:publish')
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.newsService.publish(id, user.sub);
  }
}
