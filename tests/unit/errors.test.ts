import { expect, it } from 'vitest';
import { HttpException } from '@nestjs/common';
import { mapHttpError } from '@dealith/backend';
it('maps supported HTTP failures and masks unknown exceptions', () => {
  for (const [status, code] of [
    [400, 'INVALID_REQUEST'],
    [401, 'UNAUTHENTICATED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [413, 'INVALID_REQUEST'],
    [415, 'INVALID_REQUEST'],
    [429, 'RATE_LIMITED'],
    [503, 'TEMPORARILY_UNAVAILABLE'],
  ] as const) {
    const mapped = mapHttpError(new HttpException('sensitive-exception-value', status));
    expect(mapped.status).toBe(status);
    expect(mapped.code).toBe(code);
    expect(JSON.stringify(mapped)).not.toContain('sensitive-exception-value');
  }
  expect(mapHttpError(new Error('stack-or-secret')).code).toBe('INTERNAL_ERROR');
  expect(
    mapHttpError(Object.assign(new Error('body-secret'), { type: 'entity.parse.failed' })).status,
  ).toBe(400);
  expect(mapHttpError({ status: 403, message: 'forged' }).status).toBe(500);
});
