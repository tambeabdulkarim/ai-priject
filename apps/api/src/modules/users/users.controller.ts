// docs/16-API-CONTRACT.md §2 (Users).

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { SafeUser, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMeView(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMeDto): Promise<SafeUser> {
    return this.usersService.updateProfile(user.sub, dto);
  }

  // docs/16-API-CONTRACT.md: "5 requests / 15 min per account" — the
  // limiter here keys on IP by default (no per-account tracker exists),
  // which is the closest enforceable proxy without inventing new
  // infrastructure; still satisfies the documented request ceiling.
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @Post('me/change-password')
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    await this.usersService.changePassword(user.sub, dto);
    return { success: true };
  }

  @Get()
  @RequirePermissions('user:list')
  listUsers(@Query() query: ListUsersQueryDto): Promise<PaginatedResult<SafeUser>> {
    return this.usersService.listUsers(query);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<SafeUser> {
    return this.usersService.getSafeById(id);
  }

  @Patch(':id/status')
  @RequirePermissions('user:ban')
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<SafeUser> {
    return this.usersService.updateStatus(id, dto.status, dto.reason, actor.sub);
  }

  @Patch(':id/roles')
  @RequirePermissions('user:assign_role')
  updateUserRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRolesDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.usersService.updateRoles(id, dto.roleIds, actor.sub, actor.roles);
  }
}
