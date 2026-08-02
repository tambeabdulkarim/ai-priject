// docs/16-API-CONTRACT.md §19 (Settings).

import { Injectable, NotFoundException } from '@nestjs/common';
import { Setting } from '@prisma/client';
import { AuditLogService } from '../../common/services/audit-log.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsRepository } from './settings.repository';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  /** docs/16-API-CONTRACT.md GET /settings/public — non-sensitive config as a key/value map. */
  async getPublic(): Promise<Record<string, string>> {
    const settings = await this.settingsRepository.findNonSensitive();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  /**
   * docs/16-API-CONTRACT.md GET /admin/settings — full list, `is_sensitive`
   * values redacted "even here" (10-SECURITY-BIBLE.md §17: true secrets
   * never live in this table, but a defensive redaction still applies to
   * anything flagged sensitive).
   */
  async listForAdmin(): Promise<Array<Omit<Setting, 'value'> & { value: string | null }>> {
    const settings = await this.settingsRepository.findAll();
    return settings.map((s) => ({ ...s, value: s.isSensitive ? null : s.value }));
  }

  /** docs/16-API-CONTRACT.md PATCH /admin/settings/:key — Audit Logging: Yes, mandatory, with before/after diff. */
  async updateByKey(key: string, dto: UpdateSettingDto, actorId: string): Promise<Setting> {
    const existing = await this.settingsRepository.findByKey(key);
    if (!existing) {
      throw new NotFoundException('Setting not found.');
    }

    const updated = await this.settingsRepository.updateValue(key, dto.value, actorId);

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'setting.updated',
      targetType: 'Setting',
      targetId: existing.id,
      beforeState: { key, value: existing.isSensitive ? null : existing.value },
      afterState: { key, value: existing.isSensitive ? null : updated.value },
    });

    return updated;
  }
}
