import { authenticator } from 'otplib';
import { MfaService } from './mfa.service';

describe('MfaService', () => {
  const service = new MfaService();

  describe('TOTP secret/URI', () => {
    it('generates a base32 secret', () => {
      const secret = service.generateSecret();
      expect(secret).toMatch(/^[A-Z2-7]+$/);
      expect(secret.length).toBeGreaterThanOrEqual(16);
    });

    it('builds a valid otpauth:// URI carrying the issuer, label, and secret', () => {
      const uri = service.buildOtpauthUri('learner@example.com', 'BASE32SECRETVALUE');
      expect(uri).toMatch(/^otpauth:\/\/totp\//);
      expect(uri).toContain(encodeURIComponent('learner@example.com'));
      expect(uri).toContain('secret=BASE32SECRETVALUE');
      expect(uri).toContain(encodeURIComponent('Phoenix Platform'));
    });
  });

  describe('verifyCode (real TOTP, no mocks)', () => {
    it('accepts a code generated for the same secret at the current time', () => {
      const secret = service.generateSecret();
      const code = authenticator.generate(secret);

      expect(service.verifyCode(secret, code)).toBe(true);
    });

    it('rejects a wrong code', () => {
      const secret = service.generateSecret();
      expect(service.verifyCode(secret, '000000')).toBe(false);
    });

    it('rejects a malformed token without throwing', () => {
      const secret = service.generateSecret();
      expect(service.verifyCode(secret, 'not-a-code')).toBe(false);
    });

    it('rejects a code generated for a different secret', () => {
      const secretA = service.generateSecret();
      const secretB = service.generateSecret();
      const codeForB = authenticator.generate(secretB);

      expect(service.verifyCode(secretA, codeForB)).toBe(false);
    });
  });

  describe('recovery codes', () => {
    it('generates exactly 10 unique, correctly-shaped codes', () => {
      const codes = service.generateRecoveryCodes();
      expect(codes).toHaveLength(10);
      expect(new Set(codes).size).toBe(10);
      for (const code of codes) {
        expect(code).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);
      }
    });

    it('hashes deterministically and case/whitespace-insensitively (so a user retyping it still matches)', () => {
      const hash1 = service.hashRecoveryCode('aBcDe-12345');
      const hash2 = service.hashRecoveryCode(' ABCDE-12345 ');
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
    });

    it('produces a different hash for a different code', () => {
      const codes = service.generateRecoveryCodes();
      const hashes = codes.map((c) => service.hashRecoveryCode(c));
      expect(new Set(hashes).size).toBe(hashes.length);
    });
  });
});
