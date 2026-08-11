// docs/16-API-CONTRACT.md §19 (Settings).

import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsService } from './settings.service';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('settings/public')
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Get('admin/settings')
  @RequirePermissions('settings:read')
  listForAdmin() {
    return this.settingsService.listForAdmin();
  }

  @Patch('admin/settings/:key')
  @RequirePermissions('settings:write')
  update(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateByKey(key, dto, user.sub);
  }
}
