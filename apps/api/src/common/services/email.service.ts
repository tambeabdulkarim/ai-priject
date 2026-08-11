// Phase 16: closes the "no email provider configured" Critical finding
// from docs/phase15-production-readiness-report.md. Real, working Postmark
// integration — not a placeholder. Follows the same optional-config
// pattern already established by StorageService
// (apps/api/src/storage/storage.service.ts): a `configured` flag computed
// once at startup, a clear startup log either way, real sends when
// configured.
//
// Deliberately does NOT throw/fail the caller when unconfigured, unlike
// StorageService's assertConfigured(). Storage failing IS the correct
// behavior for an upload (there's nothing useful to do without it).
// Auth flows are different: docs/15-SYSTEM-WORKFLOWS.md and this
// project's own established pattern require register/login/MFA actions to
// succeed regardless of whether the notification email could be sent
// (e.g. registration "never signs the user in and always shows the same
// check-your-email state" — that state must render even if the mail
// genuinely couldn't be dispatched). So each send method logs and returns
// false on failure or when unconfigured, rather than throwing — callers
// that need to know can check the boolean; none of the current callers
// need to (send failures are visible via the same startup/runtime log
// that Storage uses, not silent).

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: postmark.ServerClient | null;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly siteUrl: string;
  readonly configured: boolean;

  constructor(configService: ConfigService<AppConfig, true>) {
    const emailConfig = configService.get('email', { infer: true });
    this.fromAddress = emailConfig.fromAddress;
    this.fromName = emailConfig.fromName;
    this.siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    this.configured = Boolean(emailConfig.postmarkApiKey && emailConfig.fromAddress);
    this.client = this.configured ? new postmark.ServerClient(emailConfig.postmarkApiKey) : null;

    if (this.configured) {
      this.logger.log(`Email configured: provider=Postmark from=${this.fromAddress}`);
    } else {
      this.logger.warn(
        'Email is NOT configured (POSTMARK_API_KEY/EMAIL_FROM_ADDRESS empty) — verification/' +
          'password-reset/MFA emails will be logged, not delivered. See ' +
          'docs/phase15-production-readiness-report.md and docs/phase16-production-validation-report.md.',
      );
    }
  }

  private async send(to: string, subject: string, textBody: string): Promise<boolean> {
    if (!this.client) {
      this.logger.log(`Email delivery BLOCKED (not configured) — would send to ${to}: ${subject}`);
      return false;
    }
    try {
      await this.client.sendEmail({
        From: this.fromName ? `${this.fromName} <${this.fromAddress}>` : this.fromAddress,
        To: to,
        Subject: subject,
        TextBody: textBody,
        MessageStream: 'outbound',
      });
      return true;
    } catch (error) {
      // Real send failure (bad key, suppressed recipient, etc.) — logged,
      // never thrown. See the file header for why auth flows must not
      // fail just because the notification email did.
      this.logger.error(`Email send failed for ${to} (${subject}): ${(error as Error).message}`);
      return false;
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const link = `${this.siteUrl}/ar/verify-email?token=${encodeURIComponent(token)}`;
    return this.send(
      to,
      'Verify your Phoenix Project email',
      `Welcome to Phoenix Project. Confirm your email address to activate your account:\n\n${link}\n\nIf you didn't create this account, you can ignore this email.`,
    );
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const link = `${this.siteUrl}/ar/reset-password?token=${encodeURIComponent(token)}`;
    return this.send(
      to,
      'Reset your Phoenix Project password',
      `A password reset was requested for your account. Set a new password here:\n\n${link}\n\nIf you didn't request this, you can safely ignore this email — your password will not change.`,
    );
  }

  async sendMfaEnabledEmail(to: string): Promise<boolean> {
    return this.send(
      to,
      'Two-factor authentication enabled',
      'Two-factor authentication (MFA) was just enabled on your Phoenix Project account. If this wasn\'t you, sign in and disable it immediately, then change your password.',
    );
  }

  async sendMfaDisabledEmail(to: string): Promise<boolean> {
    return this.send(
      to,
      'Two-factor authentication disabled',
      'Two-factor authentication (MFA) was just disabled on your Phoenix Project account. If this wasn\'t you, sign in immediately, re-enable MFA, and change your password.',
    );
  }

  async sendMfaRecoveryCodeUsedEmail(to: string): Promise<boolean> {
    return this.send(
      to,
      'A recovery code was used on your account',
      'A two-factor recovery code was just used to sign in to your Phoenix Project account. If this was you, consider regenerating your recovery codes in Settings so the used one can\'t be reused. If this wasn\'t you, sign in immediately and change your password.',
    );
  }
}
