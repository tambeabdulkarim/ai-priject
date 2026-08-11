import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfig } from '../../config/configuration';
import { CommonModule } from '../../common/common.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { SessionsModule } from '../sessions/sessions.module';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { MfaRecoveryCodesRepository } from './mfa-recovery-codes.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    // docs/10-SECURITY-BIBLE.md §7: RS256, short-lived access tokens.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const jwtConfig = configService.get('jwt', { infer: true });
        return {
          privateKey: jwtConfig.privateKey,
          publicKey: jwtConfig.publicKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: jwtConfig.accessTokenTtl,
            issuer: jwtConfig.issuer,
          },
        };
      },
    }),
    CommonModule,
    UsersModule,
    RolesModule,
    SessionsModule,
    RefreshTokensModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MfaService, MfaRecoveryCodesRepository],
})
export class AuthModule {}
