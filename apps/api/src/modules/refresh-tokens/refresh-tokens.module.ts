import { Module } from '@nestjs/common';
import { SessionsModule } from '../sessions/sessions.module';
import { RefreshTokensService } from './refresh-tokens.service';
import { RefreshTokensRepository } from './refresh-tokens.repository';

@Module({
  imports: [SessionsModule],
  providers: [RefreshTokensService, RefreshTokensRepository],
  exports: [RefreshTokensService, RefreshTokensRepository],
})
export class RefreshTokensModule {}
