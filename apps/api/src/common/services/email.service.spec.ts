import { EmailService } from './email.service';

const sendEmailMock = jest.fn();

jest.mock('postmark', () => ({
  ServerClient: jest.fn().mockImplementation(() => ({
    sendEmail: sendEmailMock,
  })),
}));

describe('EmailService', () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue({ MessageID: 'msg-1' });
  });

  const makeService = (overrides: Partial<Record<string, string>> = {}) => {
    const emailConfig = {
      postmarkApiKey: 'pm-test-key',
      fromAddress: 'noreply@phoenix.test',
      fromName: 'Phoenix Project',
      ...overrides,
    };
    const configService = { get: jest.fn().mockReturnValue(emailConfig) };
    return new EmailService(configService as never);
  };

  it('is configured when POSTMARK_API_KEY and EMAIL_FROM_ADDRESS are both present', () => {
    const service = makeService();
    expect(service.configured).toBe(true);
  });

  it('is not configured when POSTMARK_API_KEY is empty', () => {
    const service = makeService({ postmarkApiKey: '' });
    expect(service.configured).toBe(false);
  });

  it('is not configured when EMAIL_FROM_ADDRESS is empty', () => {
    const service = makeService({ fromAddress: '' });
    expect(service.configured).toBe(false);
  });

  it('sends a real verification email via Postmark when configured, and returns true', async () => {
    const service = makeService();
    const result = await service.sendVerificationEmail('learner@phoenix.test', 'tok123');

    expect(result).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const call = sendEmailMock.mock.calls[0][0];
    expect(call.To).toBe('learner@phoenix.test');
    expect(call.From).toBe('Phoenix Project <noreply@phoenix.test>');
    expect(call.TextBody).toContain('tok123');
    expect(call.Subject).toMatch(/verify/i);
  });

  it('sends a real password reset email with the token embedded in the link', async () => {
    const service = makeService();
    await service.sendPasswordResetEmail('learner@phoenix.test', 'reset-tok');

    const call = sendEmailMock.mock.calls[0][0];
    expect(call.TextBody).toContain('reset-tok');
    expect(call.Subject).toMatch(/reset/i);
  });

  it('sends MFA enabled/disabled/recovery-code-used notifications', async () => {
    const service = makeService();

    await service.sendMfaEnabledEmail('a@b.com');
    await service.sendMfaDisabledEmail('a@b.com');
    await service.sendMfaRecoveryCodeUsedEmail('a@b.com');

    expect(sendEmailMock).toHaveBeenCalledTimes(3);
  });

  it('does not call Postmark and returns false when unconfigured — never throws', async () => {
    const service = makeService({ postmarkApiKey: '' });

    await expect(service.sendVerificationEmail('a@b.com', 'tok')).resolves.toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('returns false (not throw) when Postmark itself rejects — auth flows must never fail because of this', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('Postmark 422: invalid recipient'));
    const service = makeService();

    await expect(service.sendPasswordResetEmail('bad@bad', 'tok')).resolves.toBe(false);
  });
});
