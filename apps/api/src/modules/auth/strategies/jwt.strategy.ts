// Verifies the signature and expiry of an access token (docs/10-SECURITY-BIBLE.md
// §7), then performs the session-revocation lookup required by the same
// document: "a signed-but-revoked token is still rejected."

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../../config/configuration';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { SessionsService } from '../../sessions/sessions.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<AppConfig, true>,
    private readonly sessionsService: SessionsService,
  ) {
    const jwtConfig = configService.get('jwt', { infer: true });
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.publicKey,
      algorithms: ['RS256'],
      issuer: jwtConfig.issuer,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sessionId) {
      throw new UnauthorizedException('Invalid token.');
    }

    const session = await this.sessionsService.findById(payload.sessionId);
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Session has been revoked or expired.');
    }

    return payload;
  }
}
