// Structured request logging with a correlation id, per
// docs/09-PLATFORM-ARCHITECTURE.md §19 (correlation ID propagated through
// every downstream call) and docs/18-PROJECT-GOVERNANCE.md's logging
// requirements. Never logs request/response bodies — those may contain
// credentials or PII; only method, path, status, and duration.

import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = (request.headers['x-request-id'] as string) ?? randomUUID();
    request.headers['x-request-id'] = requestId;

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          `[${requestId}] ${request.method} ${request.originalUrl} -> ${response.statusCode} (${duration}ms)`,
        );
      }),
    );
  }
}
