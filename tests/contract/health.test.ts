import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApi, type Database, type createRedis } from '@dealith/backend';
import { readServerConfig } from '@dealith/config/server';
import { errorResponse, healthResponse, healthOpenApi, versionResponse } from '@dealith/contracts';
const config = readServerConfig({
  APP_ENV: 'test',
  DATABASE_URL: 'postgresql://unused:unused@localhost/test',
  REDIS_URL: 'redis://localhost:56379',
  API_INTERNAL_ORIGIN: 'http://localhost:4000',
  WEB_ORIGIN: 'http://localhost:3000',
  ADMIN_ORIGIN: 'http://localhost:3001',
});
let runtime: Awaited<ReturnType<typeof createApi>> | undefined;
afterEach(async () => {
  await runtime?.close();
  runtime = undefined;
});
async function build(unavailable = false) {
  const query = vi.fn(async () => {
    if (unavailable) throw new Error('postgresql://private:never-log@internal/db');
    return null;
  });
  const database = {
    outboxEvent: { findFirst: query },
    consumerReceipt: { findFirst: query },
  } as unknown as Database;
  const redis = { ping: vi.fn(async () => 'PONG') } as unknown as ReturnType<typeof createRedis>;
  runtime = await createApi(config, { database, redis });
  await runtime.app.listen(0, '127.0.0.1');
  return { api: request(runtime.app.getHttpServer()), query };
}
describe('assembled HTTP contract', () => {
  it('serves dependency-free liveness with server-owned IDs and safe headers', async () => {
    const { api, query } = await build(true);
    const response = await api
      .get('/api/v1/health/live')
      .set('X-Request-Id', 'attacker-controlled')
      .set('Origin', 'https://untrusted.example');
    expect(response.status).toBe(200);
    expect(healthResponse.parse(response.body).data).toEqual({ status: 'ok', service: 'api' });
    expect(response.headers['x-request-id']).not.toBe('attacker-controlled');
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(query).not.toHaveBeenCalled();
  });
  it('checks required persistence and Redis for readiness', async () => {
    const { api, query } = await build();
    const response = await api.get('/api/v1/health/ready');
    expect(response.status).toBe(200);
    expect(healthResponse.parse(response.body).data.status).toBe('ready');
    expect(query).toHaveBeenCalledTimes(2);
  });
  it('fails readiness without leaking dependency errors or reporting a healthy result', async () => {
    const { api } = await build(true);
    const response = await api.get('/api/v1/health/ready');
    expect(response.status).toBe(503);
    expect(errorResponse.parse(response.body).error.code).toBe('TEMPORARILY_UNAVAILABLE');
    expect(JSON.stringify(response.body)).not.toMatch(/postgresql|private|never-log|internal\/db/);
  });
  it('keeps unavailable domain and mutation routes closed', async () => {
    const { api } = await build();
    for (const path of [
      '/api/v1/settlements',
      '/api/v1/admin',
      '/api/v1/health/live',
      '/api/v1',
      '/outside',
    ]) {
      const response = await api.post(path).send({ status: 'SETTLED', role: 'SUPER_ADMIN' });
      expect(response.status).toBe(404);
      expect(errorResponse.parse(response.body).error.code).toBe('NOT_FOUND');
    }
    expect(Object.keys(healthOpenApi.paths)).toEqual([
      '/api/v1/health',
      '/api/v1/readiness',
      '/api/v1/version',
      '/api/v1/health/live',
      '/api/v1/health/ready',
    ]);
  });
  it('returns safe contracts for malformed and oversized JSON before routing', async () => {
    const { api } = await build();
    for (const [body, expectedStatus] of [
      ['{"secret":', 400],
      [JSON.stringify({ secret: 'x'.repeat(1024 * 1024) }), 413],
    ] as const) {
      const response = await api
        .post('/api/v1/unknown')
        .set('Content-Type', 'application/json')
        .send(body);
      expect(response.status).toBe(expectedStatus);
      expect(errorResponse.parse(response.body).error.code).toBe('INVALID_REQUEST');
      expect(response.text).not.toContain('secret');
    }
  });
  it('serves canonical health, readiness and safe version metadata', async () => {
    const { api } = await build();
    const live = await api.get('/api/v1/health');
    expect(healthResponse.parse(live.body).data.status).toBe('ok');
    expect(live.headers['x-trace-id']).toMatch(/^[a-f0-9]{32}$/);
    expect(live.body.meta.traceId).toBe(live.headers['x-trace-id']);
    const ready = await api.get('/api/v1/readiness');
    expect(healthResponse.parse(ready.body).data.checks).toEqual({ database: 'up', redis: 'up' });
    const version = await api.get('/api/v1/version');
    expect(versionResponse.parse(version.body).data).toEqual({
      service: 'api',
      version: '0.1.0',
      commitSha: null,
      environment: 'test',
    });
    expect(version.text).not.toMatch(/DATABASE|REDIS|postgresql|unused|stack/);
  });
  it('allows only configured browser origins and exposes safe correlation headers', async () => {
    const { api } = await build();
    const allowed = await api
      .options('/api/v1/health')
      .set('Origin', config.WEB_ORIGIN)
      .set('Access-Control-Request-Method', 'GET');
    expect(allowed.status).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe(config.WEB_ORIGIN);
    const denied = await api
      .options('/api/v1/health')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
    const response = await api.get('/api/v1/health').set('Origin', config.ADMIN_ORIGIN);
    expect(response.headers['access-control-expose-headers']).toContain('X-Trace-Id');
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
