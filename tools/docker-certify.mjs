import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { Queue } from 'bullmq';
import pg from 'pg';
import {
  createDatabase,
  createRedis,
  recordAuditInTransaction,
  dispatchPending,
  enqueueOutboxEvent,
  queueName,
} from '@dealith/backend';
import { withTraceContext } from '@dealith/observability/server';

const execute = promisify(execFile);
const project = `dealith-cert-${randomUUID().slice(0, 8)}`;
const directory = resolve('test-results/foundation');
const override = resolve(directory, `${project}.yaml`);
const applications = ['api', 'worker', 'web', 'admin'];
const evidence = { project, checks: [], containers: [], status: 'RUNNING' };
let started = false;
let database;
let redis;
let queue;
let blocker;
let browser;
async function run(file, args, timeout = 120000) {
  const result = await execute(file, args, { timeout, maxBuffer: 4 * 1024 * 1024 });
  return result.stdout.trim();
}
const compose = (...args) =>
  run('docker', ['compose', '-p', project, '-f', 'compose.yaml', '-f', override, ...args]);
async function until(check, label, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch {
      // Readiness and asynchronous worker effects may lag process startup.
    }
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`Timed out: ${label}`);
}
function pass(check, details = {}) {
  evidence.checks.push({ check, status: 'PASS', ...details });
  console.log(`PASS: ${check}`);
}
async function probe(port, path, status = 200) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    signal: AbortSignal.timeout(4000),
  });
  assert.equal(response.status, status);
  return response.json();
}
async function ready() {
  await until(async () => {
    const body = await probe(4000, '/api/v1/readiness');
    assert.deepEqual(body.data.checks, { database: 'up', redis: 'up' });
    assert.equal(body.data.status, 'ready');
    await probe(4001, '/health/ready');
    for (const port of [3000, 3001]) {
      await probe(port, '/api/v1/health/ready');
      await probe(port, '/api/v1/health/worker');
    }
    return true;
  }, 'all four container runtimes ready');
}
async function inspect(service) {
  const id = await compose('ps', '-aq', service);
  assert.ok(id && !id.includes('\n'), `one ${service} container`);
  const raw = JSON.parse(await run('docker', ['inspect', id]))[0];
  assert.equal(raw.Config.Labels['com.docker.compose.project'], project);
  return {
    service,
    id,
    name: raw.Name,
    imageId: raw.Image,
    configuredUser: raw.Config.User,
    status: raw.State.Status,
    exitCode: raw.State.ExitCode,
    oomKilled: raw.State.OOMKilled,
    health: raw.State.Health?.Status ?? null,
  };
}
const sql = (statement) =>
  compose(
    'exec',
    '-T',
    'postgres',
    'psql',
    '-U',
    'dealith_migrator',
    '-d',
    'dealith',
    '-Atc',
    statement,
  );
async function stopped(service) {
  const state = await inspect(service);
  assert.equal(state.status, 'exited');
  assert.equal(state.oomKilled, false);
  assert.ok((['web', 'admin'].includes(service) ? [0, 143] : [0]).includes(state.exitCode));
  return state;
}
async function produce() {
  const traceId = randomBytes(16).toString('hex');
  const traceparent = `00-${traceId}-${randomBytes(8).toString('hex')}-01`;
  const event = await withTraceContext({ traceparent }, () =>
    database.$transaction((tx) => recordAuditInTransaction(tx, randomUUID(), 'platform.probe')),
  );
  assert.equal(event.traceparent, traceparent);
  await dispatchPending(database, (id, carrier) => enqueueOutboxEvent(queue, id, carrier));
  const job = await queue.getJob(event.eventId);
  assert.ok(job);
  assert.equal(job.opts.attempts, 5);
  assert.deepEqual(job.opts.backoff, { type: 'exponential', delay: 1000 });
  assert.equal(job.data.traceContext.traceparent, traceparent);
  return { eventId: event.eventId, traceId };
}
async function consumed(event, count) {
  await until(async () => {
    const row = await database.outboxEvent.findUniqueOrThrow({ where: { id: event.eventId } });
    return !!row.completedAt;
  }, 'worker consumes durable intent');
  assert.equal(await database.consumerReceipt.count({ where: { eventId: event.eventId } }), 1);
  assert.equal(
    (await database.eventProjection.findUniqueOrThrow({ where: { eventType: 'audit.recorded' } }))
      .count,
    count,
  );
  const logs = await compose('logs', '--no-color', '--no-log-prefix', 'worker');
  const matched = logs.split('\n').some((line) => {
    try {
      const entry = JSON.parse(line);
      return (
        entry.event === 'worker.processed' &&
        entry.eventId === event.eventId &&
        entry.traceId === event.traceId
      );
    } catch {
      return false;
    }
  });
  assert.ok(matched, 'worker log retains event and trace correlation');
}
try {
  // Never aim destructive recovery tests at a remote daemon or an existing Compose project.
  const context = JSON.parse(await run('docker', ['context', 'inspect']))[0];
  const endpoint = process.env.DOCKER_HOST || context.Endpoints.docker.Host;
  assert.ok(endpoint.startsWith('unix://'), 'certification requires a local Docker daemon');
  assert.equal(
    await run('docker', ['ps', '-aq', '--filter', `label=com.docker.compose.project=${project}`]),
    '',
  );
  evidence.docker = await run('docker', ['--version']);
  evidence.compose = await run('docker', ['compose', 'version']);
  evidence.engine = await run('docker', [
    'info',
    '--format',
    '{{.ServerVersion}} {{.OSType}} {{.Architecture}}',
  ]);
  evidence.commit = await run('git', ['rev-parse', 'HEAD']);
  await mkdir(directory, { recursive: true });
  await writeFile(
    override,
    `services:\n  api:\n    environment:\n      OTEL_ENABLED: 'true'\n      COMMIT_SHA: '${evidence.commit}'\n  worker:\n    environment:\n      OTEL_ENABLED: 'true'\n`,
  );
  await compose('config', '--quiet');
  started = true;
  await compose('up', '-d', '--no-build');
  await until(async () => (await inspect('migrate')).status === 'exited', 'migration exits');
  const migration = await stopped('migrate');
  assert.equal(migration.configuredUser, 'node');
  const migrationUid = await compose('run', '--rm', '--no-deps', 'migrate', 'id', '-u');
  assert.notEqual(migrationUid, '0');
  await ready();
  const migrationCount = await sql(
    'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
  );
  assert.equal(migrationCount, '1');
  await compose('run', '--rm', '--no-deps', 'migrate');
  assert.equal(
    await sql(
      'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
    ),
    migrationCount,
  );
  pass('fresh container migrations and repeat deploy', {
    count: Number(migrationCount),
    migrationUid,
  });

  for (const service of applications) {
    const state = await inspect(service);
    const uid = Number(await compose('exec', '-T', service, 'id', '-u'));
    assert.ok(Number.isInteger(uid) && uid > 0, `${service} non-root runtime`);
    const processUids = await compose(
      'exec',
      '-T',
      service,
      'sh',
      '-c',
      'for p in /proc/[0-9]*/status; do sed -n "/^Uid:/p" "$p"; done',
    );
    for (const line of processUids.split('\n'))
      assert.ok(
        line
          .trim()
          .split(/\s+/)
          .slice(1)
          .every((id) => Number(id) > 0),
        `${service} process UID`,
      );
    evidence.containers.push({ ...state, uid });
  }
  for (const service of ['postgres', 'redis']) {
    const state = await inspect(service);
    assert.equal(state.health, 'healthy');
    evidence.containers.push(state);
  }
  evidence.containers.push(migration);
  pass('actual non-root application processes and healthy database/Redis');
  await probe(4000, '/api/v1/health');
  const version = await probe(4000, '/api/v1/version');
  assert.equal(version.data.commitSha, evidence.commit);
  browser = await chromium.launch();
  const page = await browser.newPage();
  for (const port of [3000, 3001]) {
    assert.equal((await page.goto(`http://127.0.0.1:${port}`)).status(), 200);
    await page.getByText('All displayed checks have confirmed readiness.').waitFor();
  }
  await browser.close();
  browser = undefined;
  pass('external health/readiness/version and hydrated web/admin');

  // These loopback URLs can only be used after our own labelled containers passed startup.
  database = createDatabase('postgresql://dealith_app:dealith_app_local@127.0.0.1:54329/dealith');
  redis = createRedis('redis://127.0.0.1:56379', true);
  queue = new Queue(queueName, { connection: redis, prefix: 'dealith_local' });
  await compose('stop', '-t', '15', 'worker');
  await stopped('worker');
  const first = await produce();
  await compose('start', 'worker');
  await consumed(first, 1);
  pass('producer to BullMQ to container worker with trace correlation');

  await compose('stop', '-t', '15', 'worker');
  const retried = await produce();
  blocker = new pg.Client({
    connectionString:
      'postgresql://dealith_migrator:dealith_migrator_local@127.0.0.1:54329/dealith',
  });
  await blocker.connect();
  await blocker.query('BEGIN');
  await blocker.query('LOCK TABLE "EventProjection" IN ACCESS EXCLUSIVE MODE');
  await compose('start', 'worker');
  await until(
    async () =>
      (await database.outboxEvent.findUniqueOrThrow({ where: { id: retried.eventId } })).failures >=
      1,
    'real transient consumer failure',
    25000,
  );
  await blocker.query('ROLLBACK');
  await blocker.end();
  blocker = undefined;
  await consumed(retried, 2);
  pass('bounded database lock causes real worker failure then successful retry');

  await compose('stop', '-t', '15', 'worker');
  const replayed = await produce();
  assert.equal(await compose('exec', '-T', 'redis', 'redis-cli', 'FLUSHDB'), 'OK');
  assert.equal(await queue.getJob(replayed.eventId), undefined);
  await database.outboxEvent.update({
    where: { id: replayed.eventId },
    data: { lastEnqueuedAt: new Date(0) },
  });
  await compose('start', 'worker');
  await consumed(replayed, 3);
  pass('complete isolated queue loss and worker restart replay exactly once');
  await queue.close();
  queue = undefined;
  redis.disconnect();
  redis = undefined;
  await database.$disconnect();
  database = undefined;

  await compose('stop', '-t', '15', 'redis');
  await until(async () => {
    await probe(4000, '/api/v1/readiness', 503);
    await probe(4001, '/health/ready', 503);
    return true;
  }, 'Redis outage fails readiness');
  await probe(4000, '/api/v1/health');
  await probe(4001, '/health/live');
  await compose('start', 'redis');
  await ready();
  await compose('restart', '-t', '15', 'api');
  await ready();
  pass('Redis interruption and API restart recover safely');

  await compose('stop', '-t', '15', ...applications);
  for (const service of applications) await stopped(service);
  for (const service of ['api', 'worker']) {
    assert.match(
      await compose('logs', '--no-color', '--no-log-prefix', service),
      /"event":"service.stopped"/,
    );
  }
  assert.equal(
    await sql("SELECT count(*) FROM pg_stat_activity WHERE usename = 'dealith_app'"),
    '0',
  );
  await compose('stop', '-t', '15', 'postgres', 'redis');
  for (const service of ['postgres', 'redis']) await stopped(service);
  pass('graceful shutdown with zero application DB sessions and no forced exits');
  await compose('up', '-d', '--no-build');
  await ready();
  pass('whole stack restarts after graceful shutdown');
  evidence.status = 'PASS';
} catch (error) {
  evidence.status = 'FAIL';
  // Only our own isolated synthetic service logs; never dump Docker inspect environment values.
  evidence.error = String(error.message).replace(
    /(?:postgresql|redis):\/\/\S+/g,
    '[redacted connection]',
  );
  if (started) {
    const logs = await compose('logs', '--no-color', '--tail', '80').catch(
      () => 'Logs unavailable',
    );
    await writeFile(
      resolve(directory, 'docker-failure.log'),
      logs.replace(/(?:postgresql|redis):\/\/\S+/g, '[redacted connection]'),
    );
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  await blocker?.end();
  await queue?.close();
  redis?.disconnect();
  await database?.$disconnect();
  if (started) {
    try {
      await compose('down', '--volumes', '--remove-orphans', '--timeout', '15');
      assert.equal(
        await run('docker', [
          'ps',
          '-aq',
          '--filter',
          `label=com.docker.compose.project=${project}`,
        ]),
        '',
      );
      assert.equal(
        await run('docker', [
          'volume',
          'ls',
          '-q',
          '--filter',
          `label=com.docker.compose.project=${project}`,
        ]),
        '',
      );
      pass('only the fresh certification project and its volumes are removed');
    } catch {
      evidence.status = 'FAIL';
      evidence.cleanup = 'FAIL';
      process.exitCode = 1;
    }
  }
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, 'docker-certification.json'),
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(`Docker certification: ${evidence.status}`);
  if (evidence.error) console.error(evidence.error);
}
