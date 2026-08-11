// docs/16-API-CONTRACT.md §14 (Media).

import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { ListMediaQueryDto } from './dto/list-media-query.dto';
import { MediaService } from './media.service';

@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // Phase 13.3 (Media Frontend). Registered before `media/:id` — same
  // ordering OrdersController already uses for `orders/me` vs
  // `orders/:id` — otherwise Nest would match "me" as the :id param.
  @Get('media/me')
  listMine(@CurrentUser() user: JwtPayload, @Query() query: ListMediaQueryDto) {
    return this.mediaService.listMine(user.sub, query);
  }

  @Get('media/:id')
  getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.mediaService.getById(id, user.sub);
  }

  @HttpCode(202)
  @Post('admin/media/:id/reprocess')
  @RequirePermissions('media:reprocess')
  reprocess(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.mediaService.reprocess(id, user.sub);
  }
}
