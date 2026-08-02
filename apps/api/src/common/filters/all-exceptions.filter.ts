// Enforces the single error envelope defined in docs/16-API-CONTRACT.md
// "Error Response Standard" platform-wide: { error: { code, message,
// details?, request_id } }. Internal exception details never reach the
// client (docs/10-SECURITY-BIBLE.md §13) — only a generic, user-safe
// message plus the correlation id for support/debugging.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) ?? randomUUID();

    const { status, body } = this.resolve(exception);

    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} -> ${status} (${body.code})`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      error: {
        ...body,
        request_id: requestId,
      },
    });
  }

  private resolve(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'object' && payload !== null && 'message' in payload) {
        const messagePayload = payload as { message: unknown; error?: string; details?: unknown };
        const isValidationArray = Array.isArray(messagePayload.message);
        return {
          status,
          body: {
            code: ERROR_CODE_BY_STATUS[status] ?? 'UNEXPECTED_ERROR',
            message: isValidationArray ? 'Validation failed' : String(messagePayload.message),
            // Validation errors surface class-validator's own array as
            // `details`; any other exception may explicitly set `details`
            // on its response payload (e.g. docs/16-API-CONTRACT.md's
            // "409 — returns the existing resource" pattern).
            details: isValidationArray ? messagePayload.message : messagePayload.details,
          },
        };
      }

      return {
        status,
        body: {
          code: ERROR_CODE_BY_STATUS[status] ?? 'UNEXPECTED_ERROR',
          message: typeof payload === 'string' ? payload : exception.message,
        },
      };
    }

    // Unknown/unhandled exception — never leak internal detail.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
      },
    };
  }
}

const ERROR_CODE_BY_STATUS: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'RESOURCE_NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  425: 'TOO_EARLY',
  429: 'RATE_LIMITED',
  501: 'NOT_IMPLEMENTED',
};
