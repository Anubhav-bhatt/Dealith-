import { z } from 'zod';
import type { AppEnvironment } from '@dealith/types';
const databaseUrl = z
  .url()
  .refine((v) => ['postgres:', 'postgresql:'].includes(URL.parse(v)?.protocol ?? ''));
const redisUrl = z
  .url()
  .refine((v) => ['redis:', 'rediss:'].includes(URL.parse(v)?.protocol ?? ''));
const origin = z
  .url()
  .refine((v) => {
    const u = URL.parse(v);
    return (
      u !== null &&
      ['http:', 'https:'].includes(u.protocol) &&
      !u.username &&
      !u.password &&
      u.pathname === '/' &&
      !u.search &&
      !u.hash
    );
  })
  .transform((v) => new URL(v).origin);
const port = z.coerce.number().int().min(1024).max(65535);
const schema = z
  .object({
    APP_ENV: z.enum(['local', 'test', 'dev', 'preview', 'staging', 'pre-production', 'production']),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_VERSION: z
      .string()
      .regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/)
      .default('0.1.0'),
    COMMIT_SHA: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z
        .string()
        .regex(/^[a-f0-9]{7,40}$/)
        .optional(),
    ),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    OTEL_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    WEB_PORT: port.default(3000),
    ADMIN_PORT: port.default(3001),
    CORS_ALLOWED_ORIGINS: z.preprocess(
      (v) =>
        typeof v === 'string'
          ? v
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
          : v,
      z.array(origin).max(20).optional(),
    ),
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    QUEUE_PREFIX: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,80}$/)
      .default('dealith'),
    API_HOST: z.enum(['127.0.0.1', '0.0.0.0']).default('127.0.0.1'),
    API_PORT: port.default(4000),
    WORKER_HOST: z.enum(['127.0.0.1', '0.0.0.0']).default('127.0.0.1'),
    WORKER_PORT: port.default(4001),
    API_INTERNAL_ORIGIN: origin,
    WORKER_INTERNAL_ORIGIN: origin.optional(),
    WEB_ORIGIN: origin,
    ADMIN_ORIGIN: origin,
    OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z
        .url()
        .refine((v) => {
          const u = URL.parse(v);
          return !!u && ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password;
        })
        .optional(),
    ),
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z
        .url()
        .refine((v) => {
          const u = URL.parse(v);
          return !!u && ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password;
        })
        .optional(),
    ),
  })
  .superRefine((value, context) => {
    if (value.WEB_ORIGIN === value.ADMIN_ORIGIN)
      context.addIssue({
        code: 'custom',
        path: ['ADMIN_ORIGIN'],
        message: 'Separate origins required',
      });
    if (new Set([value.WEB_PORT, value.ADMIN_PORT, value.API_PORT, value.WORKER_PORT]).size !== 4)
      context.addIssue({
        code: 'custom',
        path: ['WORKER_PORT'],
        message: 'Separate ports required',
      });
    if (value.APP_ENV === 'production') {
      for (const corsOrigin of value.CORS_ALLOWED_ORIGINS ?? []) {
        if (!corsOrigin.startsWith('https://'))
          context.addIssue({
            code: 'custom',
            path: ['CORS_ALLOWED_ORIGINS'],
            message: 'TLS required',
          });
      }
      for (const key of ['WEB_ORIGIN', 'ADMIN_ORIGIN'] as const) {
        if (!value[key].startsWith('https://'))
          context.addIssue({ code: 'custom', path: [key], message: 'TLS required' });
      }
      if (!value.REDIS_URL.startsWith('rediss://'))
        context.addIssue({ code: 'custom', path: ['REDIS_URL'], message: 'TLS required' });
      if (
        !['require', 'verify-ca', 'verify-full'].includes(
          URL.parse(value.DATABASE_URL)?.searchParams.get('sslmode') ?? '',
        )
      )
        context.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'TLS required' });
    }
  });
export type ServerConfig = z.infer<typeof schema> & {
  APP_ENV: AppEnvironment;
  CORS_ALLOWED_ORIGINS: string[];
};
export function readServerConfig(environment: Record<string, string | undefined>): ServerConfig {
  const result = schema.safeParse(environment);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Invalid server configuration: ${fields.join(', ')}`);
  }
  return {
    ...result.data,
    CORS_ALLOWED_ORIGINS: result.data.CORS_ALLOWED_ORIGINS ?? [
      result.data.WEB_ORIGIN,
      result.data.ADMIN_ORIGIN,
    ],
  };
}
