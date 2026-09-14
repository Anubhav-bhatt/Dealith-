// Pure validation for rendering/transport configuration. Never reads process.env or private credentials.
import { z } from 'zod';
const origin = z
  .url()
  .refine((value) => {
    const u = URL.parse(value);
    return (
      !!u &&
      ['http:', 'https:'].includes(u.protocol) &&
      !u.username &&
      !u.password &&
      u.pathname === '/' &&
      !u.search &&
      !u.hash
    );
  })
  .transform((value) => new URL(value).origin);
const schema = z
  .object({
    APP_ENV: z.enum(['local', 'test', 'dev', 'preview', 'staging', 'pre-production', 'production']),
    API_INTERNAL_ORIGIN: origin,
    WORKER_INTERNAL_ORIGIN: origin,
    WEB_ORIGIN: origin,
    ADMIN_ORIGIN: origin,
  })
  .superRefine((value, ctx) => {
    if (value.WEB_ORIGIN === value.ADMIN_ORIGIN)
      ctx.addIssue({
        code: 'custom',
        path: ['ADMIN_ORIGIN'],
        message: 'Separate origins required',
      });
    if (
      value.APP_ENV === 'production' &&
      (!value.WEB_ORIGIN.startsWith('https:') || !value.ADMIN_ORIGIN.startsWith('https:'))
    )
      ctx.addIssue({ code: 'custom', path: ['WEB_ORIGIN'], message: 'TLS required' });
  });
export function readWebRuntimeConfig(environment: Record<string, string | undefined>) {
  const result = schema.safeParse(environment);
  if (!result.success)
    throw new Error(
      `Invalid web configuration: ${[...new Set(result.error.issues.map((issue) => issue.path.join('.')))].join(', ')}`,
    );
  return result.data;
}
