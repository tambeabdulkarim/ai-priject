import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';

@Module({
  imports: [CommonModule, PermissionsModule],
  providers: [RolesService, RolesRepository],
  exports: [RolesService],
})
export class RolesModule {}
