// Phase 43 (Deployment Readiness): extracted from main.ts so the exact
// same real bootstrap logic (helmet, CORS, cookies, validation, global
// prefix, interceptors) is used both by the traditional `app.listen()`
// process (main.ts, used for local dev and any traditional Node host)
// and by the new serverless entrypoint (api/index.ts, used for a
// Vercel Functions deployment) — one real bootstrap path, not two
// diverging copies. No behavior changed from the original main.ts.

import { ValidationPipe, INestApplication } from '@nestjs/common';
import { NestFactory, AbstractHttpAdapter } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

export async function createApp(httpAdapter?: AbstractHttpAdapter): Promise<INestApplication> {
  // Phase 13.2 (Media backend): see main.ts's original comment — BigInt
  // has no native JSON.stringify support; every response involving
  // File.sizeBytes needs this polyfilled before any request is handled.
  (BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (this: bigint) {
    return this.toString();
  };

  const app = httpAdapter
    ? await NestFactory.create(AppModule, httpAdapter, { rawBody: true })
    : await NestFactory.create(AppModule, { rawBody: true });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          scriptSrc: ["'none'"],
          styleSrc: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
  );
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    next();
  });

  const frontendOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    // X-CSRF-Token: required for POST /auth/refresh's CSRF-binding check
    // (auth.controller.ts) — without it, the browser's preflight strips
    // the header before it ever reaches the API.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  return app;
}
