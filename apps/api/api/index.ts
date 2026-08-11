// Phase 43 (Deployment Readiness): Vercel Node.js serverless entrypoint.
// Vercel treats every file under apps/api/api/ as a separate serverless
// function; this one catches every request (see vercel.json's rewrite)
// and dispatches it into the same Nest application built by
// ../src/create-app.ts. The Nest app instance is created once per warm
// function instance and reused across invocations (cachedApp) — paying
// Nest's module-graph bootstrap cost on every cold start is unavoidable
// on this deployment model, but re-paying it on every request would be.

import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { Request, Response } from 'express';
import { createApp } from '../src/create-app';

let cachedExpressApp: express.Express | null = null;

async function getExpressApp(): Promise<express.Express> {
  if (!cachedExpressApp) {
    const expressInstance = express();
    const app = await createApp(new ExpressAdapter(expressInstance));
    await app.init();
    cachedExpressApp = expressInstance;
  }
  return cachedExpressApp;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const expressApp = await getExpressApp();
  expressApp(req, res);
}
