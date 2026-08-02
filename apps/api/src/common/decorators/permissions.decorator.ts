// Declares which fine-grained resource:action permissions a route
// requires, per docs/10-SECURITY-BIBLE.md §3's permission model
// (docs/13-DATABASE-BLUEPRINT.md Permissions.key). Read by PermissionsGuard.

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
