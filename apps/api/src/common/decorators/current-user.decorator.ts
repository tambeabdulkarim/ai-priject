// Injects the authenticated user's JWT payload into a controller handler,
// per docs/16-API-CONTRACT.md's "me" convention — the caller's own
// identity resolved from their token, never a client-supplied user id.

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});
