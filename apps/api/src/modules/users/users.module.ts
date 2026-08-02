import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { RolesModule } from '../roles/roles.module';
import { SessionsModule } from '../sessions/sessions.module';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

@Module({
  imports: [CommonModule, RolesModule, SessionsModule, RefreshTokensModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
