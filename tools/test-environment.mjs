import { spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
const { Client } = pg;
export async function command(commandName, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0
        ? resolve(output)
        : reject(
            new Error(
              `${commandName} failed (${code}): ${output.replace(/(?:postgresql|postgres|redis):\/\/\S+/g, '[redacted connection]')}`,
            ),
          ),
    );
  });
}
export async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const port = address.port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function ready(url, deadline = Date.now() + 10000) {
  while (Date.now() < deadline) {
    try {
      const port = Number(new URL(url).port);
      const socket = await import('node:net').then(
        ({ connect }) =>
          new Promise((resolve, reject) => {
            const socket = connect({ host: '127.0.0.1', port });
            socket.setTimeout(500);
            socket.once('connect', () => resolve(socket));
            socket.once('error', reject);
            socket.once('timeout', () => {
              socket.destroy();
              reject(new Error('Connection timeout'));
            });
          }),
      );
      socket.destroy();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error('Isolated service readiness deadline exceeded');
}
export async function createTestEnvironment() {
  const directory = await mkdtemp(join(tmpdir(), 'dealith-platform-'));
  const token = randomUUID().replaceAll('-', '');
  const databaseName = `dealith_test_${token}`;
  const roleName = `dealith_app_${token}`;
  const password = randomBytes(24).toString('hex');
  const pgData = join(directory, 'postgres');
  let nativeDatabase = false;
  let databaseCreated = false;
  let roleCreated = false;
  let redisProcess;
  let nativeRedisPort;
  const stopRedis = async () => {
    if (external) throw new Error('Cannot stop externally managed Redis');
    if (redisProcess && redisProcess.exitCode === null && redisProcess.signalCode === null) {
      const stopped = new Promise((resolve) => redisProcess.once('exit', resolve));
      redisProcess.kill('SIGTERM');
      await stopped;
    }
  };
  const startRedis = async () => {
    if (external || !nativeRedisPort) throw new Error('Cannot start externally managed Redis');
    redisProcess = spawn(
      'redis-server',
      [
        '--bind',
        '127.0.0.1',
        '--port',
        String(nativeRedisPort),
        '--save',
        '',
        '--appendonly',
        'no',
        '--dir',
        directory,
      ],
      { stdio: 'ignore', detached: process.platform !== 'win32' },
    );
    redisProcess.on('error', () => undefined);
    await ready(`redis://127.0.0.1:${nativeRedisPort}`);
  };
  let admin;
  const external = process.env.TEST_DATABASE_ADMIN_URL;
  const cleanup = async () => {
    if (admin) {
      if (databaseCreated)
        await admin
          .query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`)
          .catch(() => undefined);
      if (roleCreated)
        await admin.query(`DROP ROLE IF EXISTS "${roleName}"`).catch(() => undefined);
      await admin.end();
    }
    if (nativeDatabase)
      await command('pg_ctl', ['-D', pgData, '-m', 'fast', '-w', 'stop']).catch(() => undefined);
    if (!external) await stopRedis();
    await rm(directory, { recursive: true, force: true });
  };
  try {
    let adminUrl;
    let redisUrl;
    if (external) {
      if (!process.env.TEST_REDIS_URL)
        throw new Error('TEST_REDIS_URL is required with TEST_DATABASE_ADMIN_URL');
      adminUrl = external;
      redisUrl = process.env.TEST_REDIS_URL;
    } else {
      const pgPort = await availablePort();
      const redisPort = await availablePort();
      await mkdir(join(directory, 'sockets'));
      await command('initdb', [
        '-D',
        pgData,
        '--username=dealith_migrator',
        '--auth=trust',
        '--no-locale',
        '--encoding=UTF8',
      ]);
      await command('pg_ctl', [
        '-D',
        pgData,
        '-o',
        `-h 127.0.0.1 -p ${pgPort} -k ${join(directory, 'sockets')}`,
        '-l',
        join(directory, 'postgres.log'),
        '-w',
        'start',
      ]);
      nativeDatabase = true;
      nativeRedisPort = redisPort;
      redisUrl = `redis://127.0.0.1:${redisPort}`;
      await startRedis();
      adminUrl = `postgresql://dealith_migrator@127.0.0.1:${pgPort}/postgres`;
    }
    admin = new Client({ connectionString: adminUrl, connectionTimeoutMillis: 2000 });
    await admin.connect();
    await admin.query(
      `CREATE ROLE "${roleName}" LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`,
    );
    roleCreated = true;
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    databaseCreated = true;
    const migration = new URL(adminUrl);
    migration.pathname = '/' + databaseName;
    const runtime = new URL(migration);
    runtime.username = roleName;
    runtime.password = password;
    const environment = {
      ...process.env,
      APP_ENV: 'test',
      DATABASE_URL: runtime.href,
      MIGRATION_DATABASE_URL: migration.href,
      TEST_DATABASE_URL: migration.href,
      REDIS_URL: redisUrl,
      QUEUE_PREFIX: `dealith_test_${token}`,
      API_HOST: '127.0.0.1',
      API_PORT: '4000',
      WORKER_HOST: '127.0.0.1',
      WORKER_PORT: '4001',
      API_INTERNAL_ORIGIN: 'http://127.0.0.1:4000',
      WORKER_INTERNAL_ORIGIN: 'http://127.0.0.1:4001',
      WEB_ORIGIN: 'http://localhost:3000',
      ADMIN_ORIGIN: 'http://localhost:3001',
    };
    await command('pnpm', ['db:migrate'], environment);
    const grant = new Client({ connectionString: migration.href });
    await grant.connect();
    try {
      await grant.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC; GRANT USAGE ON SCHEMA public TO "${roleName}";
        GRANT SELECT, INSERT ON "AuditEvent" TO "${roleName}";
        GRANT SELECT, INSERT, UPDATE ON "OutboxEvent", "EventProjection" TO "${roleName}";
        GRANT SELECT, INSERT ON "ConsumerReceipt" TO "${roleName}";`);
    } finally {
      await grant.end();
    }
    return { environment, cleanup, directory, stopRedis, startRedis };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
