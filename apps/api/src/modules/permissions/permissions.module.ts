import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsRepository } from './permissions.repository';

@Module({
  providers: [PermissionsService, PermissionsRepository],
  // Exported so PermissionsGuard (a common/ provider used across every
  // module) and other feature modules can resolve a user's permissions.
  exports: [PermissionsService],
})
export class PermissionsModule {}
