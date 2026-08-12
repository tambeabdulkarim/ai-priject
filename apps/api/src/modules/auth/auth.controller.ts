// docs/16-API-CONTRACT.md §1 (Authentication).
// docs/18-PROJECT-GOVERNANCE.md §9: this module's real implementation
// required mandatory security review before it ships — see the BLOCKED
// items documented at the top of auth.service.ts for what remains out of
// scope (email delivery, OAuth, MFA) pending schema/infrastructure that
// doesn't yet exist.

import {
  Body,
  Controller,
  Headers,
  HttpCode,
  NotImplementedException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AuthService, RequestMeta } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailOnlyDto } from './dto/email-only.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { MfaEnrollConfirmDto } from './dto/mfa-enroll-confirm.dto';
import { MfaDisableDto } from './dto/mfa-disable.dto';

const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private requestMeta(req: Request): RequestMeta {
    return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  }

  // docs/phase43-deployment-readiness-report.md: the real Staging frontend
  // and backend are two different *.vercel.app sites (vercel.app is on the
  // Public Suffix List, so these are genuinely cross-site, not same-site
  // subdomains) — SameSite=Strict silently drops this cookie on every
  // cross-site fetch(), which is why `/auth/refresh` always failed in a
  // real browser despite working over direct HTTP calls. SameSite=None is
  // the only setting that reaches the API at all in this topology; the
  // CSRF exposure that removing Strict/Lax would otherwise open is closed
  // by the csrfToken mechanism below (see AuthTokens.csrfToken's comment).
  private setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: expiresAt,
      path: '/api/v1/auth',
    });
  }

  // docs/10-SECURITY-BIBLE.md §11/§2: brute-force protection — tighter
  // per-IP limits than the platform default on every unauthenticated,
  // credential- or token-issuing auth endpoint.
  // docs/16-API-CONTRACT.md: "5 requests / 15 min per IP"
  @Public()
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.requestMeta(req));
  }

  // docs/16-API-CONTRACT.md: "10 requests / 15 min per IP", "200 OK"
  @Public()
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @HttpCode(200)
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // docs/16-API-CONTRACT.md: "3 requests / 15 min per IP and per account"
  // — per-IP is what the default throttler key enforces; a per-account
  // tracker doesn't exist and isn't invented here. "200 OK"
  @Public()
  @Throttle({ default: { limit: 3, ttl: 900_000 } })
  @HttpCode(200)
  @Post('resend-verification')
  resendVerification(@Body() dto: EmailOnlyDto) {
    return this.authService.resendVerification(dto.email);
  }

  // docs/16-API-CONTRACT.md: "10 requests / 15 min per IP"
  @Public()
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.requestMeta(req));
    // docs/10-SECURITY-BIBLE.md §5 (Phase 14.2): an MFA-enabled account
    // gets a challenge token instead of real tokens — no refresh cookie
    // is set until POST /auth/mfa/verify succeeds.
    if ('mfaRequired' in result) {
      return result;
    }
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, user: result.user, csrfToken: result.csrfToken };
  }

  // docs/10-SECURITY-BIBLE.md §5 (Phase 14.2). Public (the caller has no
  // access token yet at this point) — same rate-limit shape as `login`
  // itself, since this is equally a credential-verification endpoint.
  @Public()
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @HttpCode(200)
  @Post('mfa/verify')
  async mfaVerify(
    @Body() dto: MfaVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMfaChallenge(dto, this.requestMeta(req));
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, user: result.user, csrfToken: result.csrfToken };
  }

  // docs/10-SECURITY-BIBLE.md §5 (Phase 14.2) — enrollment/management,
  // all authenticated (unlike login/mfa-verify above).
  @Post('mfa/enroll/begin')
  mfaEnrollBegin(@CurrentUser() user: JwtPayload) {
    return this.authService.beginMfaEnrollment(user.sub);
  }

  @HttpCode(200)
  @Post('mfa/enroll/confirm')
  mfaEnrollConfirm(@CurrentUser() user: JwtPayload, @Body() dto: MfaEnrollConfirmDto) {
    return this.authService.confirmMfaEnrollment(user.sub, dto);
  }

  @HttpCode(204)
  @Post('mfa/disable')
  mfaDisable(@CurrentUser() user: JwtPayload, @Body() dto: MfaDisableDto) {
    return this.authService.disableMfa(user.sub, dto.password);
  }

  @HttpCode(200)
  @Post('mfa/recovery-codes/regenerate')
  mfaRegenerateRecoveryCodes(@CurrentUser() user: JwtPayload) {
    return this.authService.regenerateMfaRecoveryCodes(user.sub);
  }

  // BLOCKED: no OAuth-identity table exists in docs/13-DATABASE-BLUEPRINT.md
  // to link a provider account to a Users row — see auth.service.ts header.
  @Public()
  @Post('oauth/:provider/callback')
  oauthCallback(@Param('provider') _provider: string, @Body() _dto: OAuthCallbackDto): never {
    throw new NotImplementedException(
      'BLOCKED: no OAuth-identity table exists in docs/13-DATABASE-BLUEPRINT.md.',
    );
  }

  // docs/16-API-CONTRACT.md: "30 requests / 15 min per session" — the
  // default throttler keys by IP, the closest enforceable proxy without a
  // per-session tracker.
  @Public()
  @Throttle({ default: { limit: 30, ttl: 900_000 } })
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-csrf-token') csrfToken?: string,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!raw) {
      throw new UnauthorizedException('No refresh token cookie present.');
    }
    const result = await this.authService.refresh(raw, csrfToken);
    this.setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, csrfToken: result.csrfToken };
  }

  @HttpCode(204)
  @Post('logout')
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(user);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  }

  @HttpCode(200)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logoutAll(user);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    return result;
  }

  // docs/16-API-CONTRACT.md: "3 requests / 15 min per IP and per account"
  @Public()
  @Throttle({ default: { limit: 3, ttl: 900_000 } })
  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body() dto: EmailOnlyDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // docs/16-API-CONTRACT.md: "5 requests / 15 min per IP", "Success Codes: 200 OK"
  @Public()
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @HttpCode(200)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
