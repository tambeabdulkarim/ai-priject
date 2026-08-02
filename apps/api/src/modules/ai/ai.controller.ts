// docs/16-API-CONTRACT.md §15 (AI).

import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AiService } from './ai.service';
import { CreateAiRequestDto } from './dto/create-ai-request.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // BLOCKED BY DOCUMENTATION — see ai.service.ts. DTO validation on the
  // documented generic envelope still runs; dispatch itself does not.
  @Post('requests')
  createRequest(@CurrentUser() _user: JwtPayload, @Body() _dto: CreateAiRequestDto): never {
    return this.aiService.createRequest();
  }

  @Get('requests/:id')
  getRequestById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.aiService.getRequestById(id, user.sub);
  }

  @Get('usage/me')
  getMyUsage(@CurrentUser() user: JwtPayload) {
    return this.aiService.getMyUsage(user.sub);
  }
}
