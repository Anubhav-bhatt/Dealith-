import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';
import { context, trace, propagation, metrics, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PeriodicExportingMetricReader, AggregationTemporality } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { safeLogFields } from '@dealith/security/server';
const local = new AsyncLocalStorage<{ traceId: string; spanId: string; requestId?: string }>();
export type LogEvent =
  | 'service.started'
  | 'service.stopped'
  | 'service.failed'
  | 'http.completed'
  | 'worker.processed'
  | 'worker.failed'
  | 'redis.unavailable';
export function createLogger(service: 'api' | 'worker') {
  return (event: LogEvent, fields: Record<string, unknown> = {}) => {
    const level = event.endsWith('failed') || event === 'redis.unavailable' ? 'error' : 'info';
    if (['warn', 'error'].includes(process.env.LOG_LEVEL ?? '') && level === 'info') return;
    const environment = [
      'local',
      'test',
      'dev',
      'preview',
      'staging',
      'pre-production',
      'production',
    ].includes(process.env.APP_ENV ?? '')
      ? process.env.APP_ENV
      : 'unknown';
    process.stdout.write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service,
        environment,
        message: event,
        event,
        ...safeLogFields({ ...local.getStore(), ...fields }),
      }) + '\n',
    );
  };
}
export function startTelemetry(
  service: 'api' | 'worker',
  endpoint?: string,
  options: { enabled?: boolean; metricsEndpoint?: string; environment?: string } = {},
) {
  const enabled = options.enabled ?? Boolean(endpoint);
  // With no collector, discard measurements rather than unexpectedly contacting a default endpoint.
  const metricReader = enabled
    ? new PeriodicExportingMetricReader({
        exporter: options.metricsEndpoint
          ? new OTLPMetricExporter({ url: options.metricsEndpoint })
          : {
              export: (_data, done) => done({ code: 0 }),
              selectAggregationTemporality: () => AggregationTemporality.CUMULATIVE,
              forceFlush: async () => {},
              shutdown: async () => {},
            },
        exportIntervalMillis: 60000,
      })
    : undefined;
  const sdk = enabled
    ? new NodeSDK({
        autoDetectResources: false,
        resource: resourceFromAttributes({
          'service.name': `dealith-${service}`,
          'deployment.environment.name': options.environment ?? 'local',
        }),
        traceExporter: endpoint
          ? new OTLPTraceExporter({ url: endpoint })
          : {
              export: (_spans, done) => done({ code: 0 }),
              shutdown: async () => {},
            },
        ...(metricReader ? { metricReaders: [metricReader] } : {}),
      })
    : undefined;
  sdk?.start();
  return {
    shutdown: async () => {
      await sdk?.shutdown();
    },
  };
}
export function captureTraceContext(): Record<string, string> {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  const current = local.getStore();
  if (!carrier.traceparent && current)
    carrier.traceparent = `00-${current.traceId}-${current.spanId}-01`;
  return carrier;
}
export function withTraceContext<T>(carrier: Record<string, string>, action: () => T): T {
  const parent = carrier.traceparent;
  const match = parent?.match(/^00-([a-f0-9]{32})-([a-f0-9]{16})-0[01]$/);
  const traceId = match?.[1];
  const spanId = match?.[2];
  const run = () => context.with(propagation.extract(context.active(), carrier), action);
  return traceId && spanId && !/^0+$/.test(traceId) && !/^0+$/.test(spanId)
    ? local.run({ traceId, spanId }, run)
    : run();
}
export function startHttpSpan(method: string, path: string, requestId: string) {
  const span = trace
    .getTracer('dealith-platform')
    .startSpan('http.request', { kind: SpanKind.SERVER });
  const sc = span.spanContext();
  const traceId = /^0+$/.test(sc.traceId) ? randomBytes(16).toString('hex') : sc.traceId;
  const spanId = /^0+$/.test(sc.spanId) ? randomBytes(8).toString('hex') : sc.spanId;
  const started = performance.now();
  const route = [
    '/api/v1/health',
    '/api/v1/readiness',
    '/api/v1/version',
    '/api/v1/health/live',
    '/api/v1/health/ready',
  ].includes(path)
    ? path
    : 'unmatched';
  const verb = ['GET', 'POST', 'OPTIONS', 'HEAD', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ? method
    : 'OTHER';
  span.setAttributes({ 'http.request.method': verb, 'http.route': route });
  return {
    traceId,
    run: <T>(action: () => T) =>
      local.run({ traceId, spanId, requestId }, () =>
        context.with(trace.setSpan(context.active(), span), action),
      ),
    finish: (status: number) => {
      span.setAttribute('http.response.status_code', status);
      if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
      metrics
        .getMeter('dealith-platform')
        .createHistogram('http.server.request.duration', { unit: 'ms' })
        .record(performance.now() - started, {
          'http.route': route,
          'http.request.method': verb,
          'http.response.status_code': status,
        });
      span.end();
    },
  };
}
export async function inSpan<T>(name: string, action: () => Promise<T>): Promise<T> {
  const started = performance.now();
  return trace.getTracer('dealith-platform').startActiveSpan(name, async (span) => {
    let failed = false;
    try {
      return await action();
    } catch (error) {
      failed = true;
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      metrics
        .getMeter('dealith-platform')
        .createHistogram('foundation.operation.duration', { unit: 'ms' })
        .record(performance.now() - started, { operation: name, failed });
      span.end();
    }
  });
}
