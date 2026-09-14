import { z } from 'zod';
import { opaqueId } from '@dealith/validation';
export const errorCode = z.enum([
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'CONFLICT',
  'RATE_LIMITED',
  'NOT_FOUND',
  'INVALID_REQUEST',
  'TEMPORARILY_UNAVAILABLE',
  'INTERNAL_ERROR',
]);
export const healthResponse = z
  .object({
    data: z
      .object({
        status: z.enum(['ok', 'ready']),
        service: z.enum(['api', 'worker']),
        checks: z
          .object({ database: z.literal('up'), redis: z.literal('up') })
          .strict()
          .optional(),
      })
      .strict(),
    meta: z
      .object({
        requestId: opaqueId,
        traceId: z
          .string()
          .regex(/^[a-f0-9]{32}$/)
          .optional(),
      })
      .strict(),
  })
  .strict();
export const errorResponse = z
  .object({
    error: z
      .object({
        code: errorCode,
        message: z.string(),
        requestId: opaqueId,
        traceId: z
          .string()
          .regex(/^[a-f0-9]{32}$/)
          .optional(),
        fieldErrors: z.array(z.object({ field: z.string(), code: z.string() }).strict()),
        retryable: z.boolean(),
      })
      .strict(),
  })
  .strict();
export type HealthResponse = z.infer<typeof healthResponse>;
export type ErrorResponse = z.infer<typeof errorResponse>;
export const versionResponse = z
  .object({
    data: z
      .object({
        service: z.literal('api'),
        version: z.string(),
        commitSha: z.string().nullable(),
        environment: z.enum([
          'local',
          'test',
          'dev',
          'preview',
          'staging',
          'pre-production',
          'production',
        ]),
      })
      .strict(),
    meta: z
      .object({
        requestId: opaqueId,
        traceId: z
          .string()
          .regex(/^[a-f0-9]{32}$/)
          .optional(),
      })
      .strict(),
  })
  .strict();
export const healthOpenApi = {
  openapi: '3.1.0',
  info: { title: 'Dealith Platform API', version: '1.1.0' },
  paths: Object.fromEntries(
    (
      [
        ['/api/v1/health', 'getHealth', healthResponse],
        ['/api/v1/readiness', 'getReadiness', healthResponse],
        ['/api/v1/version', 'getVersion', versionResponse],
        ['/api/v1/health/live', 'getLegacyLiveness', healthResponse],
        ['/api/v1/health/ready', 'getLegacyReadiness', healthResponse],
      ] satisfies Array<[string, string, z.ZodType]>
    ).map(([path, operationId, schema]) => [
      path,
      {
        get: {
          operationId,
          responses: {
            '200': {
              description: 'Success',
              content: { 'application/json': { schema: z.toJSONSchema(schema) } },
            },
            '503': {
              description: 'Dependency unavailable',
              content: { 'application/json': { schema: z.toJSONSchema(errorResponse) } },
            },
          },
        },
      },
    ]),
  ),
};
