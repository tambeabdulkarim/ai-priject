import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { RolesModule } from '../roles/roles.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

@Module({
  imports: [CommonModule, RolesModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
