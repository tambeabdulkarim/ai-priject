// Thin wrapper around the Upstash Redis REST API (docs/09-PLATFORM-ARCHITECTURE.md
// cloud infrastructure pivot — Upstash is the provisioned Redis, accessed over
// REST rather than a TCP client since this environment cannot open raw TCP
// connections to it). Used for: session-revocation-adjacent fast lookups
// (docs/10-SECURITY-BIBLE.md §7), single-use email-verification/password-reset
// token tracking (docs/10-SECURITY-BIBLE.md §4 — no dedicated Postgres table
// exists for these per-token records, so this is the sanctioned cache layer
// per docs/11-DATABASE-BIBLE.md §1 "Redis... derived, rebuildable caches"),
// and permission-set caching (Phase 3 mission: "Permission caching").

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    const redisConfig = configService.get('redis', { infer: true });
    this.baseUrl = redisConfig.upstashRestUrl;
    this.token = redisConfig.upstashRestToken;
  }

  private get isConfigured(): boolean {
    return Boolean(this.baseUrl && this.token);
  }

  private async command<T = unknown>(path: string): Promise<T | null> {
    if (!this.isConfigured) {
      this.logger.warn('Upstash Redis is not configured — cache operation skipped.');
      return null;
    }
    const response = await fetch(`${this.baseUrl}/${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) {
      this.logger.error(`Redis command failed: ${path} -> ${response.status}`);
      return null;
    }
    const body = (await response.json()) as { result: T };
    return body.result;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const encodedValue = encodeURIComponent(value);
    const path = ttlSeconds
      ? `set/${encodeURIComponent(key)}/${encodedValue}?EX=${ttlSeconds}`
      : `set/${encodeURIComponent(key)}/${encodedValue}`;
    await this.command(path);
  }

  async get(key: string): Promise<string | null> {
    return this.command<string>(`get/${encodeURIComponent(key)}`);
  }

  async del(key: string): Promise<void> {
    await this.command(`del/${encodeURIComponent(key)}`);
  }
}
