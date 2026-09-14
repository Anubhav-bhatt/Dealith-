import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { map } from 'rxjs';
import helmet from 'helmet';
import { safeMessages } from '@dealith/security/server';
import { createLogger, startHttpSpan } from '@dealith/observability/server';
import type { ServerConfig } from '@dealith/config/server';
import { AppModule } from './health.js';
import { createDatabase, type Database } from './database.js';
import { createRedis } from './redis.js';
import type { Redis } from 'ioredis';
const log = createLogger('api');
/** Map trusted framework/parser categories, never send exception text or arbitrary properties. */
export function mapHttpError(exception: unknown) {
  const parserTypes: Record<string, number> = {
    'entity.parse.failed': 400,
    'request.aborted': 400,
    'request.size.invalid': 400,
    'entity.too.large': 413,
    'encoding.unsupported': 415,
    'charset.unsupported': 415,
  };
  const parserStatus =
    exception instanceof Error && 'type' in exception && typeof exception.type === 'string'
      ? parserTypes[exception.type]
      : undefined;
  const rawStatus =
    exception instanceof HttpException ? exception.getStatus() : (parserStatus ?? 500);
  const status = [400, 401, 403, 404, 409, 413, 415, 429, 503].includes(rawStatus)
    ? rawStatus
    : 500;
  const code =
    status === 401
      ? 'UNAUTHENTICATED'
      : status === 403
        ? 'FORBIDDEN'
        : status === 409
          ? 'CONFLICT'
          : status === 429
            ? 'RATE_LIMITED'
            : status === 404
              ? 'NOT_FOUND'
              : status === 503
                ? 'TEMPORARILY_UNAVAILABLE'
                : status < 500
                  ? 'INVALID_REQUEST'
                  : 'INTERNAL_ERROR';
  return {
    status,
    code,
    message: safeMessages[code],
    fieldErrors: [],
    retryable: status === 503 || status === 429,
  };
}
@Catch()
class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, ...safe } = mapHttpError(exception);
    response.status(status).json({
      error: {
        ...safe,
        requestId: response.locals.requestId,
        traceId: response.locals.traceId,
      },
    });
  }
}
class ResponseEnvelope implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: { requestId: response.locals.requestId, traceId: response.locals.traceId },
      })),
    );
  }
}
export async function createApi(
  config: ServerConfig,
  supplied?: { database: Database; redis: Redis },
) {
  const database = supplied?.database ?? createDatabase(config.DATABASE_URL);
  const redis = supplied?.redis ?? createRedis(config.REDIS_URL);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(config, database, redis),
    { logger: false, bodyParser: false },
  );
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use((request: Request, response: Response, next: NextFunction) => {
    const started = performance.now();
    response.locals.requestId = randomUUID();
    response.setHeader('X-Request-Id', response.locals.requestId as string);
    const span = startHttpSpan(request.method, request.path, response.locals.requestId as string);
    response.locals.traceId = span.traceId;
    response.setHeader('X-Trace-Id', span.traceId);
    let finished = false;
    const finishSpan = () => {
      if (finished) return;
      finished = true;
      span.finish(response.writableFinished ? response.statusCode : 499);
    };
    response.once('finish', finishSpan);
    response.once('close', finishSpan);
    response.setHeader('Cache-Control', 'private, no-store');
    response.on('finish', () =>
      log('http.completed', {
        requestId: response.locals.requestId,
        traceId: response.locals.traceId,
        status: response.statusCode,
        durationMs: Math.round(performance.now() - started),
      }),
    );
    span.run(next);
  });
  app.use(
    helmet({
      strictTransportSecurity:
        config.APP_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );
  app.enableCors({
    origin: config.CORS_ALLOWED_ORIGINS,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    exposedHeaders: ['X-Request-Id', 'X-Trace-Id'],
    credentials: true,
    maxAge: 600,
  });
  app.useBodyParser('json', { limit: '1mb' });
  app.setGlobalPrefix('/api/v1');
  app.useGlobalFilters(new SafeExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelope());
  await app.init();
  // The dedicated API process also owns requests outside its versioned prefix.
  app.use((_: Request, response: Response) =>
    response.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: safeMessages.NOT_FOUND,
        requestId: response.locals.requestId,
        traceId: response.locals.traceId,
        fieldErrors: [],
        retryable: false,
      },
    }),
  );
  return {
    app,
    database,
    redis,
    close: async () => {
      try {
        await app.close();
      } finally {
        if (!supplied) {
          redis.disconnect();
          await database.$disconnect();
        }
      }
    },
  };
}
