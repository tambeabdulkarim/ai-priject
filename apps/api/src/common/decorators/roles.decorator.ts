// Declares which roles may access a route. Read by RolesGuard.
// docs/10-SECURITY-BIBLE.md §3: role checks are enforced server-side on
// every request — this decorator is the declaration, RolesGuard is the
// enforcement.

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
