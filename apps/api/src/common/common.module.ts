// Wires the platform-wide guard chain and error envelope as global
// providers. docs/16-API-CONTRACT.md "Authentication Flow": every request
// passes through the same signature/expiry/revocation check, authorization
// check, and error envelope — never an endpoint-specific bypass.

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PermissionsModule } from '../modules/permissions/permissions.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { PasswordService } from './services/password.service';
import { AuditLogService } from './services/audit-log.service';

@Module({
  imports: [PermissionsModule],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Order matters: authenticate, then role-check, then permission-check.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    PasswordService,
    AuditLogService,
  ],
  exports: [PasswordService, AuditLogService],
})
export class CommonModule {}
