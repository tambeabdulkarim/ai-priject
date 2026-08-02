// docs/16-API-CONTRACT.md §14 (Media).

import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { MediaService } from './media.service';

@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

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
