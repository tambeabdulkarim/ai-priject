// Global default guard — every route requires a valid access token unless
// explicitly marked @Public(). docs/16-API-CONTRACT.md "Authentication Flow":
// every request passes through the same signature/expiry/revocation check
// before reaching business logic; there is no endpoint-specific bypass
// other than the declared exceptions.
//
// @Public() means "authentication is optional," not "authentication is
// skipped": several public endpoints (e.g. GET /courses — doc16 §4:
// "instructors/admins see their own drafts additionally when
// authenticated") need CurrentUser() populated when a valid token IS
// present. The strategy always runs; only the "reject if missing/invalid"
// behavior is suppressed on public routes.

import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest<TUser = JwtPayload>(
    err: unknown,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // No/invalid token on a public route is not an error — just anonymous.
      return (user || undefined) as TUser;
    }

    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException();
    }
    return user;
  }
}
