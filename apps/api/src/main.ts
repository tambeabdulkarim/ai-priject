// Application bootstrap. docs/16-API-CONTRACT.md "Versioning Strategy":
// every endpoint is served under /api/v1 — no unversioned endpoint is
// ever exposed.
//
// Phase 43 (Deployment Readiness): the actual middleware/config setup
// (helmet, CORS, cookies, validation, global prefix, interceptors) now
// lives in ./create-app.ts so the serverless entrypoint (api/index.ts,
// used for a Vercel Functions deployment) uses the exact same real
// bootstrap logic instead of a second, diverging copy. This file keeps
// only what's specific to a traditional long-running Node process:
// reading the configured port and calling app.listen().

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createApp } from './create-app';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const configService = app.get(ConfigService<AppConfig, true>);

  const port = configService.get('port', { infer: true });
  await app.listen(port);
  Logger.log(`Phoenix API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
