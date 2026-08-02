// Data-access layer for Settings (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Setting } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Setting[]> {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  findNonSensitive(): Promise<Setting[]> {
    return this.prisma.setting.findMany({ where: { isSensitive: false }, orderBy: { key: 'asc' } });
  }

  findByKey(key: string): Promise<Setting | null> {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  updateValue(key: string, value: string, updatedById: string): Promise<Setting> {
    return this.prisma.setting.update({ where: { key }, data: { value, updatedById } });
  }
}
