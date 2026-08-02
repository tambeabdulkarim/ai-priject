// docs/10-SECURITY-BIBLE.md §3: Role_Permissions is "the actual
// authorization source of truth checked on every API request"
// (docs/13-DATABASE-BLUEPRINT.md Role_Permissions). Runs after
// JwtAuthGuard, so request.user is populated.

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { PermissionsService } from '../../modules/permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.sub;

    if (!userId) {
      return false;
    }

    const granted = await this.permissionsService.getPermissionKeysForUser(userId);
    return requiredPermissions.every((permission) => granted.includes(permission));
  }
}
