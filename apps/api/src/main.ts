import 'reflect-metadata';
import { createApi } from '@dealith/backend';
import { readServerConfig } from '@dealith/config/server';
import { createLogger, startTelemetry } from '@dealith/observability/server';
const log = createLogger('api');
try {
  const config = readServerConfig(process.env);
  const telemetry = startTelemetry('api', config.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT, {
    enabled: config.OTEL_ENABLED,
    environment: config.APP_ENV,
    ...(config.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
      ? { metricsEndpoint: config.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT }
      : {}),
  });
  const runtime = await createApi(config);
  await runtime.app.listen(config.API_PORT, config.API_HOST);
  log('service.started');
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    await runtime.close();
    await telemetry.shutdown();
    clearTimeout(deadline);
    log('service.stopped');
  };
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.on(signal, () => {
      void close().catch(() => process.exit(1));
    });
} catch {
  log('service.failed');
  process.exit(1);
}
