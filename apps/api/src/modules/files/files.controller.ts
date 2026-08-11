// docs/16-API-CONTRACT.md §13 (Files).

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
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
  getById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.filesService.getById(id, user.sub, user.roles);
  }

  // Phase 13.3 (Media Frontend).
  @HttpCode(204)
  @Delete(':id')
  deleteFile(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.filesService.deleteFile(id, user.sub, user.roles);
  }
}
