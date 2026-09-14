import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createApi } from '@dealith/backend';
import { readServerConfig } from '@dealith/config/server';
import { healthResponse, versionResponse, errorResponse } from '@dealith/contracts';
let runtime: Awaited<ReturnType<typeof createApi>>;
beforeAll(async () => {
  if (process.env.APP_ENV !== 'test' || !process.env.TEST_DATABASE_URL?.includes('/dealith_test_'))
    throw new Error('Use isolated test infrastructure');
  runtime = await createApi(readServerConfig(process.env));
  if (runtime.redis.status !== 'ready')
    await new Promise<void>((resolve) => runtime.redis.once('ready', resolve));
  await runtime.app.listen(0, '127.0.0.1');
});
afterAll(async () => {
  await runtime?.close();
});
it('certifies live HTTP contracts against the newly migrated database and Redis', async () => {
  const api = request(runtime.app.getHttpServer());
  for (const path of ['/api/v1/health', '/api/v1/readiness']) {
    const result = await api.get(path);
    expect(result.status).toBe(200);
    healthResponse.parse(result.body);
  }
  const version = await api.get('/api/v1/version');
  expect(versionResponse.parse(version.body).data.service).toBe('api');
  const missing = await api.get('/api/v1/projects');
  expect(missing.status).toBe(404);
  errorResponse.parse(missing.body);
  const malformed = await api
    .post('/api/v1/unknown')
    .set('Content-Type', 'application/json')
    .send('{"secret":');
  expect(malformed.status).toBe(400);
  expect(malformed.text).not.toContain('secret');
});
