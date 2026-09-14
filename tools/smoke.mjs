import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { Queue } from 'bullmq';
import {
  createDatabase,
  createRedis,
  recordAuditInTransaction,
  dispatchPending,
} from '@dealith/backend';
import { healthResponse, errorResponse } from '@dealith/contracts';
import { availablePort, command, createTestEnvironment } from './test-environment.mjs';

if (process.env.TEST_DATABASE_ADMIN_URL || process.env.TEST_REDIS_URL) {
  throw new Error('The recovery smoke test requires its own disposable native services');
}
const context = await createTestEnvironment();
const processes = [];
let database;
let browser;
let restored;
let restoredDatabase;
let queue;
let queueRedis;
async function until(check, label, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch {
      /* Retry until the observable condition holds. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${label}`);
}
function start(name, args, environment) {
  const child = spawn(process.execPath, args, {
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const entry = { name, child, output: '', failure: undefined };
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (chunk) => {
      entry.output = (entry.output + chunk).slice(-20000);
    });
  child.on('error', (error) => {
    entry.failure = error;
  });
  processes.push(entry);
  return entry;
}
async function stop(entry) {
  if (entry.child.exitCode !== null || entry.child.signalCode !== null) return;
  const exited = new Promise((resolve) => entry.child.once('exit', resolve));
  entry.child.kill('SIGTERM');
  let timer;
  try {
    await Promise.race([
      exited,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          entry.child.kill('SIGKILL');
          reject(new Error(`${entry.name} did not stop gracefully`));
        }, 12000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  // Next exits with the conventional 128 + SIGTERM code after its shutdown handler.
  const expected = ['web', 'admin'].includes(entry.name) ? [0, 143] : [0];
  assert.ok(expected.includes(entry.child.exitCode), `${entry.name} shutdown exit code`);
}
async function response(origin, path, status, service) {
  const result = await fetch(origin + path, { signal: AbortSignal.timeout(4000) });
  assert.equal(result.status, status);
  assert.match(result.headers.get('cache-control') ?? '', /no-store/);
  const body = await result.json();
  if (status === 200) assert.equal(healthResponse.parse(body).data.service, service);
  else errorResponse.parse(body);
  return true;
}
try {
  const [apiPort, workerPort, webPort, adminPort] = await Promise.all(
    Array.from({ length: 4 }, () => availablePort()),
  );
  const api = `http://127.0.0.1:${apiPort}`;
  const workerOrigin = `http://127.0.0.1:${workerPort}`;
  const web = `http://127.0.0.1:${webPort}`;
  const admin = `http://127.0.0.1:${adminPort}`;
  const environment = {
    ...context.environment,
    API_PORT: String(apiPort),
    WORKER_PORT: String(workerPort),
    API_INTERNAL_ORIGIN: api,
    WORKER_INTERNAL_ORIGIN: workerOrigin,
    WEB_ORIGIN: web,
    ADMIN_ORIGIN: admin,
  };
  database = createDatabase(environment.DATABASE_URL);
  await command('pnpm', ['db:migrate'], environment);
  await command('pnpm', ['db:status'], environment);
  start('api', ['apps/api/dist/main.js'], environment);
  let worker = start('worker', ['apps/worker/dist/main.js'], environment);
  for (const [name, port] of [
    ['web', webPort],
    ['admin', adminPort],
  ]) {
    start(name, ['tools/start-next.mjs', name, String(port)], environment);
  }
  await Promise.all([
    until(() => response(api, '/api/v1/health/ready', 200, 'api'), 'API readiness'),
    until(() => response(workerOrigin, '/health/ready', 200, 'worker'), 'worker readiness'),
    ...[web, admin].map((origin) =>
      until(() => response(origin, '/api/v1/health/ready', 200, 'api'), 'runtime health proxy'),
    ),
  ]);
  console.log('PASS: four independent production processes; repeatable migration; runtime proxies');

  browser = await chromium.launch();
  await mkdir('test-results/foundation', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(web);
  assert.match(await page.locator('h1').innerText(), /Dealith/);
  await page.screenshot({ path: 'test-results/foundation/web-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/foundation/web-mobile.png', fullPage: true });
  await page.goto(admin);
  assert.match(await page.locator('h1').innerText(), /Dealith Admin/);
  await page.screenshot({ path: 'test-results/foundation/admin-mobile.png', fullPage: true });
  await browser.close();
  browser = undefined;

  await context.stopRedis();
  await Promise.all([
    until(() => response(api, '/api/v1/health/ready', 503), 'API rejects unavailable Redis'),
    until(() => response(workerOrigin, '/health/ready', 503), 'worker rejects unavailable Redis'),
    until(() => response(web, '/api/v1/health/ready', 503), 'proxy rejects unavailable Redis'),
  ]);
  await response(api, '/api/v1/health/live', 200, 'api');
  await response(workerOrigin, '/health/live', 200, 'worker');
  await context.startRedis();
  await until(() => response(workerOrigin, '/health/ready', 200, 'worker'), 'worker reconnects');
  console.log('PASS: Redis outage fails readiness; liveness survives; reconnection recovers');

  await stop(worker);
  const event = await database.$transaction((tx) =>
    recordAuditInTransaction(tx, randomUUID(), 'platform.probe'),
  );
  queueRedis = createRedis(environment.REDIS_URL, true);
  queue = new Queue('dealith-platform-outbox-v1', {
    connection: queueRedis,
    prefix: environment.QUEUE_PREFIX,
  });
  await dispatchPending(database, (id) => queue.add('deliver', { eventId: id }, { jobId: id }));
  assert.ok(await queue.getJob(event.eventId));
  await queue.close();
  queue = undefined;
  queueRedis.disconnect();
  queueRedis = undefined;
  await context.stopRedis();
  await context.startRedis();
  // Advance the persisted retry eligibility instead of sleeping for its 30 second interval.
  await database.outboxEvent.update({
    where: { id: event.eventId },
    data: { lastEnqueuedAt: new Date(0) },
  });
  worker = start('restarted worker', ['apps/worker/dist/main.js'], environment);
  await until(
    async () => (await database.consumerReceipt.count()) === 1,
    'outbox replay after worker and Redis restart',
  );
  assert.equal(
    (await database.eventProjection.findUniqueOrThrow({ where: { eventType: 'audit.recorded' } }))
      .count,
    1,
  );
  assert.ok(
    (await database.outboxEvent.findUniqueOrThrow({ where: { id: event.eventId } })).completedAt,
  );
  console.log('PASS: committed intent survives worker restart and complete Redis queue loss');

  await stop(worker);
  const backup = join(context.directory, 'platform.dump');
  await command('pg_dump', [
    '--dbname',
    environment.MIGRATION_DATABASE_URL,
    '--format=custom',
    '--data-only',
    '--no-owner',
    '--no-privileges',
    '--table="AuditEvent"',
    '--table="OutboxEvent"',
    '--table="ConsumerReceipt"',
    '--table="EventProjection"',
    '--file',
    backup,
  ]);
  restored = await createTestEnvironment();
  await command('pg_restore', [
    '--dbname',
    restored.environment.MIGRATION_DATABASE_URL,
    '--data-only',
    '--no-owner',
    '--no-privileges',
    '--exit-on-error',
    backup,
  ]);
  restoredDatabase = createDatabase(restored.environment.DATABASE_URL);
  assert.equal(await restoredDatabase.auditEvent.count(), 1);
  assert.equal(await restoredDatabase.consumerReceipt.count(), 1);
  assert.equal(
    (
      await restoredDatabase.eventProjection.findUniqueOrThrow({
        where: { eventType: 'audit.recorded' },
      })
    ).count,
    1,
  );
  assert.ok(
    (await restoredDatabase.outboxEvent.findUniqueOrThrow({ where: { id: event.eventId } }))
      .completedAt,
  );
  console.log('PASS: synthetic platform backup restored into a separate migrated database');
  for (const entry of processes) await stop(entry);
  console.log('PASS: all processes shut down gracefully; screenshots in test-results/foundation');
} catch (error) {
  for (const entry of processes) {
    console.error(
      `${entry.name}: exit=${entry.child.exitCode}; spawnFailure=${Boolean(entry.failure)}`,
    );
    console.error(
      entry.output.replace(/(?:postgresql|postgres|redis):\/\/\S+/g, '[redacted connection]'),
    );
  }
  throw error;
} finally {
  await browser?.close();
  await queue?.close();
  queueRedis?.disconnect();
  const results = await Promise.allSettled(processes.map(stop));
  await database?.$disconnect();
  await restoredDatabase?.$disconnect();
  await restored?.cleanup();
  await context.cleanup();
  if (results.some((result) => result.status === 'rejected')) process.exitCode = 1;
}
