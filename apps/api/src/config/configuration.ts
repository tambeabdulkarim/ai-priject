// Typed environment configuration, loaded via @nestjs/config.
// docs/10-SECURITY-BIBLE.md §17: no secret is ever hardcoded — every value
// here is read from the environment, with safe, non-secret defaults only
// where a default is genuinely safe (e.g. PORT).

export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwt: {
    privateKey: string;
    publicKey: string;
    accessTokenTtl: string;
    issuer: string;
  };
  redis: {
    upstashRestUrl: string;
    upstashRestToken: string;
  };
  security: {
    passwordPepper: string;
    mfaEncryptionKey: string;
  };
  storage: {
    endpoint: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  email: {
    postmarkApiKey: string;
    fromAddress: string;
    fromName: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwt: {
    // docs/10-SECURITY-BIBLE.md §7: asymmetric signing (RS256/EdDSA) so
    // only apps/api holds the private key; every other service verifies
    // with the public key alone.
    privateKey: process.env.JWT_PRIVATE_KEY ?? '',
    publicKey: process.env.JWT_PUBLIC_KEY ?? '',
    // docs/10-SECURITY-BIBLE.md §7: short-lived access tokens (15 min).
    accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL ?? '15m',
    issuer: process.env.JWT_ISSUER ?? 'phoenix-platform',
  },
  redis: {
    upstashRestUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
    upstashRestToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  },
  security: {
    // docs/10-SECURITY-BIBLE.md §4: per-install pepper, secrets-manager-held.
    passwordPepper: process.env.PASSWORD_PEPPER ?? '',
    // docs/10-SECURITY-BIBLE.md §5: per-install AES-256-GCM key protecting
    // stored TOTP secrets at rest. Same env-var-secret pattern as the
    // pepper above — see Phase 14.2's MFA Security Architecture Review for
    // why (no secrets-manager/KMS infrastructure exists in this project
    // yet, same situation Storage was in before a provider was chosen).
    mfaEncryptionKey: process.env.MFA_ENCRYPTION_KEY ?? '',
  },
  storage: {
    // docs/09-PLATFORM-ARCHITECTURE.md §9 / docs/10-SECURITY-BIBLE.md §14:
    // presigned-URL direct-to-storage, S3-compatible endpoint.
    endpoint: process.env.STORAGE_ENDPOINT ?? '',
    bucket: process.env.STORAGE_BUCKET ?? '',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? '',
    // 'auto' is correct for R2/MinIO/most path-style S3-compatible
    // providers; a real AWS S3 deployment must set a real region string.
    region: process.env.STORAGE_REGION ?? 'auto',
  },
  stripe: {
    // docs/10-SECURITY-BIBLE.md §13: payment provider, signature-verified webhooks.
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },
  email: {
    // Phase 16: closes the "no email provider configured" Critical finding
    // from docs/phase15-production-readiness-report.md. Postmark chosen
    // over the other option named in docs/09-PLATFORM-ARCHITECTURE.md §11
    // ("email via SES/Postmark") — no AWS account/infra exists anywhere
    // else in this project (Storage deliberately moved OFF AWS-shaped
    // infra to Backblaze B2 in Phase 13.7), and Postmark is purpose-built
    // for transactional mail (verification/reset/MFA), which is exactly
    // this project's real, current email need — not bulk/marketing send.
    postmarkApiKey: process.env.POSTMARK_API_KEY ?? '',
    fromAddress: process.env.EMAIL_FROM_ADDRESS ?? '',
    fromName: process.env.EMAIL_FROM_NAME ?? 'Phoenix Project',
  },
});
