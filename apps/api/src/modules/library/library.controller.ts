// docs/16-API-CONTRACT.md §9 (Library).

import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { ListLibraryItemsQueryDto } from './dto/list-library-items-query.dto';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { LibraryService } from './library.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Public()
  @Get('items')
  list(@Query() query: ListLibraryItemsQueryDto) {
    return this.libraryService.list(query);
  }

  @Public()
  @Get('items/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.libraryService.getBySlug(slug);
  }

  // docs/16-API-CONTRACT.md: "20 requests / hour per user"
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @Post('items/:id/access')
  grantAccess(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload, @Req() req: Request) {
    return this.libraryService.grantAccess(id, user.sub, req.ip);
  }

  @Post('items/:id/bookmark')
  bookmark(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.libraryService.bookmark(id, user.sub);
  }

  @HttpCode(204)
  @Delete('items/:id/bookmark')
  async removeBookmark(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    await this.libraryService.removeBookmark(id, user.sub);
  }

  // docs/16-API-CONTRACT.md: "60 requests / 5 min per user"
  @Throttle({ default: { limit: 60, ttl: 300_000 } })
  @Put('items/:id/progress')
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReadingProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.libraryService.updateProgress(id, user.sub, dto.lastPosition);
  }
}
