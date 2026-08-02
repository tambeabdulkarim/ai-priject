// docs/16-API-CONTRACT.md §13 (Files).

import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  @Post('upload-url')
  requestUploadUrl(@CurrentUser() user: JwtPayload, @Body() dto: RequestUploadUrlDto) {
    return this.filesService.requestUploadUrl(user.sub, user.roles, dto);
  }

  @Post(':uploadId/complete')
  completeUpload(
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.filesService.completeUpload(uploadId, user.sub);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.getById(id);
  }
}
