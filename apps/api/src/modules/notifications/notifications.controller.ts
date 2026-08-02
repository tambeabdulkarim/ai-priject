// docs/16-API-CONTRACT.md §17 (Notifications).

import {
  Controller,
  Get,
  NotImplementedException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  listMine(@CurrentUser() user: JwtPayload, @Query() query: ListNotificationsQueryDto) {
    return this.notificationsService.listForUser(user.sub, query);
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markRead(id, user.sub);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: JwtPayload): Promise<{ marked_read: number }> {
    const count = await this.notificationsService.markAllRead(user.sub);
    return { marked_read: count };
  }

  // BLOCKED: docs/16-API-CONTRACT.md requires a "per-category channel
  // opt-in/out map" to be persisted per user, but no such column exists on
  // Users and no Notification_Preferences table exists anywhere in
  // docs/13-DATABASE-BLUEPRINT.md. Implementing this would require adding
  // storage the approved architecture doesn't define — left as a documented
  // architectural blocker rather than invented.
  @Patch('preferences')
  updatePreferences(): never {
    throw new NotImplementedException(
      'BLOCKED: no storage exists for notification preferences in docs/13-DATABASE-BLUEPRINT.md (no column on Users, no Notification_Preferences table).',
    );
  }
}
