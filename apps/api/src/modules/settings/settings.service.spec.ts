import { NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const makeService = () => {
    const settingsRepository = {
      findAll: jest.fn(),
      findNonSensitive: jest.fn(),
      findByKey: jest.fn(),
      updateValue: jest.fn(),
    };
    const auditLogService = { record: jest.fn() };
    const service = new SettingsService(settingsRepository as never, auditLogService as never);
    return { service, settingsRepository, auditLogService };
  };

  describe('getPublic', () => {
    it('returns only non-sensitive settings as a key/value map', async () => {
      const { service, settingsRepository } = makeService();
      settingsRepository.findNonSensitive.mockResolvedValue([
        { key: 'feature.dark_mode', value: 'true' },
        { key: 'feature.beta_banner', value: 'false' },
      ]);

      const result = await service.getPublic();

      expect(result).toEqual({ 'feature.dark_mode': 'true', 'feature.beta_banner': 'false' });
    });
  });

  describe('listForAdmin', () => {
    it('redacts the value of sensitive settings even for admin listing', async () => {
      const { service, settingsRepository } = makeService();
      settingsRepository.findAll.mockResolvedValue([
        { key: 'public.flag', value: 'on', isSensitive: false },
        { key: 'secret.key', value: 'super-secret', isSensitive: true },
      ]);

      const result = await service.listForAdmin();

      expect(result.find((s) => s.key === 'public.flag')?.value).toBe('on');
      expect(result.find((s) => s.key === 'secret.key')?.value).toBeNull();
    });
  });

  describe('updateByKey', () => {
    it('throws 404 for an unknown setting key', async () => {
      const { service, settingsRepository } = makeService();
      settingsRepository.findByKey.mockResolvedValue(null);

      await expect(
        service.updateByKey('missing.key', { value: 'x' }, 'admin1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the value and records a mandatory audit log with before/after diff', async () => {
      const { service, settingsRepository, auditLogService } = makeService();
      settingsRepository.findByKey.mockResolvedValue({
        id: 's1',
        key: 'feature.dark_mode',
        value: 'false',
        isSensitive: false,
      });
      settingsRepository.updateValue.mockResolvedValue({
        id: 's1',
        key: 'feature.dark_mode',
        value: 'true',
        isSensitive: false,
      });

      const result = await service.updateByKey('feature.dark_mode', { value: 'true' }, 'admin1');

      expect(result.value).toBe('true');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'setting.updated',
          targetId: 's1',
          beforeState: { key: 'feature.dark_mode', value: 'false' },
          afterState: { key: 'feature.dark_mode', value: 'true' },
        }),
      );
    });

    it('never leaks a sensitive value into the audit log diff', async () => {
      const { service, settingsRepository, auditLogService } = makeService();
      settingsRepository.findByKey.mockResolvedValue({
        id: 's2',
        key: 'secret.key',
        value: 'old-secret',
        isSensitive: true,
      });
      settingsRepository.updateValue.mockResolvedValue({
        id: 's2',
        key: 'secret.key',
        value: 'new-secret',
        isSensitive: true,
      });

      await service.updateByKey('secret.key', { value: 'new-secret' }, 'admin1');

      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeState: { key: 'secret.key', value: null },
          afterState: { key: 'secret.key', value: null },
        }),
      );
    });
  });
});
