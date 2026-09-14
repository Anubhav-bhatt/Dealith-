export { safeMessages } from './public.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Drop unknown fields rather than attempting to enumerate every possible secret.
export function safeLogFields(input: Record<string, unknown>): Record<string, string | number> {
  const output: Record<string, string | number> = {};
  for (const key of [
    'requestId',
    'eventId',
    'userId',
    'organizationId',
    'projectId',
    'dealId',
    'settlementId',
  ] as const) {
    const value = input[key];
    if (typeof value === 'string' && uuid.test(value)) output[key] = value;
  }
  const traceId = input.traceId;
  if (typeof traceId === 'string' && /^[a-f0-9]{32}$/.test(traceId) && !/^0+$/.test(traceId))
    output.traceId = traceId;
  for (const key of ['status', 'durationMs', 'count'] as const) {
    const value = input[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) output[key] = value;
  }
  return output;
}

export const sensitiveKeys = Object.freeze([
  'password',
  'authorization',
  'cookie',
  'token',
  'secret',
  'privateKey',
  'seedPhrase',
  'databaseUrl',
]);
// Callers use node:crypto or Web Crypto. No custom cryptography, credentials or auth are implemented here.
export const cryptoBoundary = Object.freeze({
  randomSource: 'operating-system',
  credentialsImplemented: false,
});
