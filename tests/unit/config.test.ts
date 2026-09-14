import { describe, expect, it } from 'vitest';
import { readServerConfig } from '@dealith/config/server';
import { publicConfig } from '@dealith/config/public';
const valid = {
  APP_ENV: 'test',
  DATABASE_URL: 'postgresql://local:synthetic-secret@127.0.0.1:54329/test',
  REDIS_URL: 'redis://127.0.0.1:56379',
  API_INTERNAL_ORIGIN: 'http://127.0.0.1:4000',
  WEB_ORIGIN: 'http://localhost:3000',
  ADMIN_ORIGIN: 'http://localhost:3001',
};
describe('configuration boundaries', () => {
  it('requires explicit service URLs and rejects invalid protocols without revealing credentials', () => {
    expect(() => readServerConfig({})).toThrow('Invalid server configuration');
    expect(() =>
      readServerConfig({ ...valid, DATABASE_URL: 'mysql://user:do-not-leak@localhost/db' }),
    ).toThrow('DATABASE_URL');
    try {
      readServerConfig({ ...valid, DATABASE_URL: 'mysql://user:do-not-leak@localhost/db' });
    } catch (error) {
      expect(String(error)).not.toContain('do-not-leak');
    }
  });
  it('keeps staff origins and listener ports distinct', () => {
    expect(() => readServerConfig({ ...valid, ADMIN_ORIGIN: valid.WEB_ORIGIN })).toThrow(
      'ADMIN_ORIGIN',
    );
    expect(() => readServerConfig({ ...valid, ADMIN_ORIGIN: valid.WEB_ORIGIN + '/' })).toThrow(
      'ADMIN_ORIGIN',
    );
    expect(() => readServerConfig({ ...valid, WORKER_PORT: '4000' })).toThrow('WORKER_PORT');
    expect(() =>
      readServerConfig({ ...valid, API_INTERNAL_ORIGIN: 'http://user:secret@localhost' }),
    ).toThrow('API_INTERNAL_ORIGIN');
    expect(readServerConfig(valid).API_PORT).toBe(4000);
  });
  it('rejects malformed URLs through the safe field-only configuration error', () => {
    for (const APP_ENV of ['test', 'production']) {
      for (const field of [
        'DATABASE_URL',
        'REDIS_URL',
        'API_INTERNAL_ORIGIN',
        'WEB_ORIGIN',
        'ADMIN_ORIGIN',
      ]) {
        let thrown: unknown;
        try {
          readServerConfig({ ...valid, APP_ENV, [field]: 'http://credential-secret@' });
        } catch (error) {
          thrown = error;
        }
        expect(thrown).toBeInstanceOf(Error);
        expect((thrown as Error).message).toContain('Invalid server configuration:');
        expect((thrown as Error).message).toContain(field);
        expect(JSON.stringify(thrown)).not.toContain('credential-secret');
      }
    }
  });
  it('requires production transport security', () => {
    expect(() => readServerConfig({ ...valid, APP_ENV: 'production' })).toThrow(
      'Invalid server configuration',
    );
  });
  it('exposes a fixed public allowlist and keeps unavailable capabilities disabled', () => {
    expect(publicConfig.capabilities).toEqual({
      registration: false,
      settlement: false,
      crypto: false,
    });
    expect(JSON.stringify(publicConfig)).not.toMatch(/DATABASE|REDIS|secret|provider/i);
    expect(Object.isFrozen(publicConfig.capabilities)).toBe(true);
  });
});

it('rejects wildcard origins, malformed telemetry settings and ambiguous runtime flags', () => {
  expect(() => readServerConfig({ ...valid, CORS_ALLOWED_ORIGINS: '*' })).toThrow(
    'CORS_ALLOWED_ORIGINS',
  );
  expect(() => readServerConfig({ ...valid, OTEL_ENABLED: 'yes' })).toThrow('OTEL_ENABLED');
  expect(() => readServerConfig({ ...valid, LOG_LEVEL: 'verbose' })).toThrow('LOG_LEVEL');
  expect(() =>
    readServerConfig({
      ...valid,
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'https://token-secret@collector.example',
    }),
  ).toThrow('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT');
  expect(readServerConfig(valid).CORS_ALLOWED_ORIGINS).toEqual([
    valid.WEB_ORIGIN,
    valid.ADMIN_ORIGIN,
  ]);
});
