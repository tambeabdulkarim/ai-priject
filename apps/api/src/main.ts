// Application bootstrap. docs/16-API-CONTRACT.md "Versioning Strategy":
// every endpoint is served under /api/v1 — no unversioned endpoint is
// ever exposed.

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);

  // docs/16-API-CONTRACT.md: the refresh token is set via an httpOnly cookie.
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  // docs/16-API-CONTRACT.md Validation Rules: every request body is
  // validated against a strict schema; unknown fields are rejected, not
  // silently ignored (whitelist + forbidNonWhitelisted).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = configService.get('port', { infer: true });
  await app.listen(port);
  Logger.log(`Phoenix API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
