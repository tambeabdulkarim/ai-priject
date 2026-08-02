// Marks a route as not requiring authentication, per docs/16-API-CONTRACT.md
// endpoints documented with "Authentication Required: No". JwtAuthGuard
// checks for this metadata and skips the token check when present.

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
