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
  },
});
