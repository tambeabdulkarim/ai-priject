// Phase 16: minimal production health/readiness endpoint. Not a new
// platform feature — standard ops infrastructure needed to deploy behind
// any load balancer/uptime monitor, and explicitly required by
// docs/phase15-production-readiness-report.md's email-provider item
// ("Update: ... health checks"). Reports configuration presence only
// (booleans), never secret values. `@Public()` — an unauthenticated
// monitoring probe can't carry a JWT.

import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/services/email.service';
import { AppConfig } from '../config/configuration';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @Get()
  async check() {
    const database = await this.checkDatabase();
    const redisConfig = this.configService.get('redis', { infer: true });
    const storageConfig = this.configService.get('storage', { infer: true });
    const stripeConfig = this.configService.get('stripe', { infer: true });

    const checks = {
      database,
      redis: Boolean(redisConfig.upstashRestUrl && redisConfig.upstashRestToken),
      storage: Boolean(storageConfig.endpoint && storageConfig.bucket),
      stripe: Boolean(stripeConfig.secretKey),
      email: this.emailService.configured,
    };

    const allHealthy = Object.values(checks).every(Boolean);

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
