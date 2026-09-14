import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Queue, Worker } from 'bullmq';
import type { ServerConfig } from '@dealith/config/server';
import {
  createLogger,
  captureTraceContext,
  withTraceContext,
  inSpan,
} from '@dealith/observability/server';
import { safeMessages } from '@dealith/security/server';
import { createDatabase } from './database.js';
import { createRedis } from './redis.js';
import { consumeOnce, dispatchPending } from './outbox.js';
export const queueName = 'dealith-platform-outbox-v1';
export function enqueueOutboxEvent(
  queue: Queue,
  eventId: string,
  traceContext = captureTraceContext(),
) {
  return withTraceContext(traceContext, () =>
    inSpan('queue.publish', () =>
      queue.add(
        'deliver',
        { eventId, traceContext },
        {
          jobId: eventId,
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          // PostgreSQL owns retry exhaustion and retains failed intents. A retained failed job
          // would block replay by ID when an outage prevented persisting the consumer failure.
          removeOnFail: true,
        },
      ),
    ),
  );
}
export async function startWorker(config: ServerConfig) {
  const log = createLogger('worker');
  const database = createDatabase(config.DATABASE_URL);
  const connection = createRedis(config.REDIS_URL, true, 'worker');
  const consumerConnection = createRedis(config.REDIS_URL, true, 'worker');
  const healthRedis = createRedis(config.REDIS_URL, false, 'worker');
  const queue = new Queue(queueName, { connection, prefix: config.QUEUE_PREFIX });
  const worker = new Worker(
    queueName,
    async (job) => {
      const id = typeof job.data?.eventId === 'string' ? job.data.eventId : '';
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
        throw new Error('Invalid event reference');
      const traceparent: unknown = job.data?.traceContext?.traceparent;
      await withTraceContext(typeof traceparent === 'string' ? { traceparent } : {}, () =>
        inSpan('queue.process', async () => {
          await consumeOnce(database, id);
          log('worker.processed', { eventId: id });
        }),
      );
    },
    {
      connection: consumerConnection,
      prefix: config.QUEUE_PREFIX,
      concurrency: 4,
      // Keep connection-recovery sleeps within the process's 10-second shutdown budget.
      runRetryDelay: 1000,
    },
  );
  worker.on('error', () => log('worker.failed'));
  worker.on('failed', (job) =>
    log('worker.failed', { eventId: job?.id, count: job?.attemptsMade }),
  );
  queue.on('error', () => log('worker.failed'));
  let active = false;
  let stopped = false;
  let lastSuccessfulPoll = 0;
  let pending: Promise<void> = Promise.resolve();
  const poll = () => {
    if (active || stopped) return;
    active = true;
    pending = (async () => {
      try {
        await inSpan('redis.ping', () => healthRedis.ping());
        await dispatchPending(database, (eventId, traceContext) =>
          enqueueOutboxEvent(queue, eventId, traceContext),
        );
        lastSuccessfulPoll = Date.now();
      } catch {
        log('worker.failed');
      } finally {
        active = false;
      }
    })();
  };
  const interval = setInterval(poll, 1000);
  poll();
  const server = createServer(async (request, response) => {
    const requestId = randomUUID();
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Request-Id', requestId);
    let status = 200;
    if (request.method !== 'GET' || !['/health/live', '/health/ready'].includes(request.url ?? ''))
      status = 404;
    else if (request.url === '/health/ready') {
      try {
        if (Date.now() - lastSuccessfulPoll > 5000) throw new Error('Poll stale');
        await Promise.all([
          healthRedis.ping(),
          database.consumerReceipt.findFirst({ select: { eventId: true } }),
        ]);
      } catch {
        status = 503;
      }
    }
    response.statusCode = status;
    if (status === 200)
      response.end(
        JSON.stringify({
          data: { status: request.url === '/health/live' ? 'ok' : 'ready', service: 'worker' },
          meta: { requestId },
        }),
      );
    else {
      const code = status === 404 ? 'NOT_FOUND' : 'TEMPORARILY_UNAVAILABLE';
      response.end(
        JSON.stringify({
          error: {
            code,
            message: safeMessages[code],
            requestId,
            fieldErrors: [],
            retryable: status === 503,
          },
        }),
      );
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.WORKER_PORT, config.WORKER_HOST, resolve);
  });
  log('service.started');
  return {
    close: async () => {
      stopped = true;
      clearInterval(interval);
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await pending;
      await worker.close();
      await queue.close();
      connection.disconnect();
      consumerConnection.disconnect();
      healthRedis.disconnect();
      await database.$disconnect();
      log('service.stopped');
    },
  };
}
