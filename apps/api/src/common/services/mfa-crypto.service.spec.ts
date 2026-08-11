import { MfaCryptoService } from './mfa-crypto.service';

describe('MfaCryptoService', () => {
  const makeService = (key?: string) => {
    const configService = {
      get: jest.fn().mockReturnValue({
        mfaEncryptionKey: key ?? Buffer.alloc(32, 7).toString('base64'),
      }),
    };
    return new MfaCryptoService(configService as never);
  };

  it('round-trips a real TOTP secret through encrypt/decrypt', () => {
    const service = makeService();
    const secret = 'JBSWY3DPEHPK3PXP';

    const encrypted = service.encrypt(secret);
    expect(encrypted).not.toBe(secret);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    expect(service.decrypt(encrypted)).toBe(secret);
  });

  it('produces a different ciphertext each time (random IV — never reused)', () => {
    const service = makeService();
    const secret = 'JBSWY3DPEHPK3PXP';

    const first = service.encrypt(secret);
    const second = service.encrypt(secret);

    expect(first).not.toBe(second);
    expect(service.decrypt(first)).toBe(secret);
    expect(service.decrypt(second)).toBe(secret);
  });

  it('throws (fails closed) if the encryption key is not configured', () => {
    const service = makeService('');
    expect(() => service.encrypt('secret')).toThrow('MFA is not configured');
  });

  it('throws on a tampered ciphertext rather than silently returning garbage (GCM auth-tag check)', () => {
    const service = makeService();
    const encrypted = service.encrypt('JBSWY3DPEHPK3PXP');
    const [iv, tag, ciphertext] = encrypted.split(':');
    const tamperedCiphertext = Buffer.from(ciphertext, 'base64');
    tamperedCiphertext[0] ^= 0xff; // flip a bit
    const tampered = [iv, tag, tamperedCiphertext.toString('base64')].join(':');

    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('throws on a malformed payload', () => {
    const service = makeService();
    expect(() => service.decrypt('not-a-valid-payload')).toThrow('Malformed MFA secret payload.');
  });
});
