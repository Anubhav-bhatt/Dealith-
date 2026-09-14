import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import {
  captureTraceContext,
  createLogger,
  inSpan,
  startHttpSpan,
  startTelemetry,
  withTraceContext,
} from '@dealith/observability/server';
it('exports correlated spans and duration metrics to an isolated OTLP HTTP sink', async () => {
  const received: Array<{ path: string; body: string }> = [];
  const server = createServer((request, response) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += String(chunk);
    });
    request.on('end', () => {
      received.push({ path: request.url ?? '', body });
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test listener');
  const endpoint = `http://127.0.0.1:${address.port}`;
  const telemetry = startTelemetry('api', endpoint + '/v1/traces', {
    enabled: true,
    metricsEndpoint: endpoint + '/v1/metrics',
    environment: 'test',
  });
  try {
    const http = startHttpSpan('GET', '/api/v1/health?password=never-export', randomUUID());
    let carrier: Record<string, string> = {};
    await http.run(() =>
      inSpan('database.readiness', async () => {
        carrier = captureTraceContext();
      }),
    );
    http.finish(200);
    await withTraceContext(carrier, () =>
      inSpan('queue.process', async () => {
        await inSpan('redis.ping', async () => 'PONG');
      }),
    );
    await telemetry.shutdown();
    const traces = received
      .filter((value) => value.path === '/v1/traces')
      .map((value) => value.body)
      .join('');
    expect(traces).toContain(http.traceId);
    expect(traces).toContain('queue.process');
    expect(traces).toContain('database.readiness');
    expect(traces).not.toContain('never-export');
    const measurements = received
      .filter((value) => value.path === '/v1/metrics')
      .map((value) => value.body)
      .join('');
    expect(measurements).toContain('foundation.operation.duration');
    expect(measurements).toContain('http.server.request.duration');
  } finally {
    await telemetry.shutdown();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
it('writes structured severity/environment/correlation and drops secret content', () => {
  vi.stubEnv('APP_ENV', 'test');
  vi.stubEnv('LOG_LEVEL', 'info');
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  try {
    createLogger('api')('http.completed', {
      requestId: randomUUID(),
      traceId: 'a'.repeat(32),
      password: 'never-log',
      body: 'private',
      status: 200,
    });
    const text = String(write.mock.calls[0]?.[0]);
    expect(text).toContain('"level":"info"');
    expect(text).toContain('"environment":"test"');
    expect(text).toContain('"traceId"');
    expect(text).not.toMatch(/never-log|private|password/);
  } finally {
    write.mockRestore();
    vi.unstubAllEnvs();
  }
});
