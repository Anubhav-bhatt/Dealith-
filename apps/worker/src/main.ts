import 'reflect-metadata';
import { startWorker } from '@dealith/backend';
import { readServerConfig } from '@dealith/config/server';
import { createLogger, startTelemetry } from '@dealith/observability/server';
const log = createLogger('worker');
try {
  const config = readServerConfig(process.env);
  const telemetry = startTelemetry('worker', config.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT, {
    enabled: config.OTEL_ENABLED,
    environment: config.APP_ENV,
    ...(config.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
      ? { metricsEndpoint: config.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT }
      : {}),
  });
  const runtime = await startWorker(config);
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    await runtime.close();
    await telemetry.shutdown();
    clearTimeout(deadline);
  };
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.on(signal, () => {
      void close().catch(() => process.exit(1));
    });
} catch {
  log('service.failed');
  process.exit(1);
}
