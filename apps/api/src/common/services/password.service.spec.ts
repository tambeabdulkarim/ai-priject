import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const configService = {
    get: () => ({ passwordPepper: 'test-pepper' }),
  } as unknown as ConfigService<never, true>;
  const service = new PasswordService(configService);

  it('hashes a password and verifies the same password against it', async () => {
    const hash = await service.hash('CorrectHorseBattery9');
    await expect(service.verify(hash, 'CorrectHorseBattery9')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hash('CorrectHorseBattery9');
    await expect(service.verify(hash, 'WrongPassword123')).resolves.toBe(false);
  });

  it('produces different hashes for the same input (random salt)', async () => {
    const a = await service.hash('CorrectHorseBattery9');
    const b = await service.hash('CorrectHorseBattery9');
    expect(a).not.toEqual(b);
  });
});
