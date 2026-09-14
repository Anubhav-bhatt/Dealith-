import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Queue, QueueEvents, UnrecoverableError, Worker } from 'bullmq';
import {
  createDatabase,
  createRedis,
  recordAuditInTransaction,
  consumeOnce,
  dispatchPending,
  applyEventProjection,
  enqueueOutboxEvent,
  type Database,
} from '@dealith/backend';
let database: Database;
let admin: pg.Client;
const record = () =>
  database.$transaction((tx) => recordAuditInTransaction(tx, randomUUID(), 'platform.probe'));
beforeAll(async () => {
  if (
    process.env.APP_ENV !== 'test' ||
    !process.env.DATABASE_URL ||
    !process.env.TEST_DATABASE_URL ||
    !new URL(process.env.TEST_DATABASE_URL).pathname.startsWith('/dealith_test_')
  )
    throw new Error('Use the isolated integration harness');
  database = createDatabase(process.env.DATABASE_URL);
  admin = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.connect();
});
beforeEach(async () => {
  await admin.query(
    'TRUNCATE "ConsumerReceipt", "OutboxEvent", "AuditEvent", "EventProjection" CASCADE',
  );
});
afterAll(async () => {
  await database?.$disconnect();
  await admin?.end();
});
describe('PostgreSQL transaction and outbox invariants', () => {
  it('retains an ambiguous enqueue and reuses its event identity after lease expiry', async () => {
    const event = await record();
    await expect(
      dispatchPending(database, async () => {
        throw new Error('Connection lost after possible send');
      }),
    ).rejects.toThrow('Outbox enqueue unavailable');
    const pending = await database.outboxEvent.findUniqueOrThrow({ where: { id: event.eventId } });
    expect(pending.completedAt).toBeNull();
    expect(pending.lastEnqueuedAt).toBeNull();
    expect(pending.leaseUntil).not.toBeNull();
    expect(await dispatchPending(database, async () => undefined)).toBe(0);
    await database.outboxEvent.update({
      where: { id: event.eventId },
      data: { leaseUntil: new Date(0) },
    });
    const sent: string[] = [];
    expect(
      await dispatchPending(database, async (id) => {
        sent.push(id);
      }),
    ).toBe(1);
    expect(sent).toEqual([event.eventId]);
  });
  it('rolls back audit and accepted intent with a failed business transaction', async () => {
    await expect(
      database.$transaction(async (tx) => {
        await recordAuditInTransaction(tx, randomUUID(), 'platform.probe');
        throw new Error('Injected pre-commit failure');
      }),
    ).rejects.toThrow('Injected');
    expect(await database.auditEvent.count()).toBe(0);
    expect(await database.outboxEvent.count()).toBe(0);
    const event = await record();
    expect(await database.auditEvent.count()).toBe(1);
    expect(
      (await database.outboxEvent.findUniqueOrThrow({ where: { id: event.eventId } })).auditEventId,
    ).toBe(event.payload.auditId);
  });
  it('uses a runtime role without table ownership, superuser, bypass RLS or audit mutation', async () => {
    const roles = await database.$queryRaw<
      Array<{ rolsuper: boolean; rolbypassrls: boolean }>
    >`SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
    expect(roles[0]).toEqual({ rolsuper: false, rolbypassrls: false });
    const event = await record();
    await expect(
      database.auditEvent.update({
        where: { id: event.payload.auditId },
        data: { action: 'forged' },
      }),
    ).rejects.toThrow();
    await expect(
      database.outboxEvent.update({
        where: { id: event.eventId },
        data: { eventType: 'settlement.released' },
      }),
    ).rejects.toThrow();
  });
  it('commits exactly one projection effect and receipt under concurrent redelivery', async () => {
    const event = await record();
    const outcomes = await Promise.all(
      Array.from({ length: 8 }, () => consumeOnce(database, event.eventId)),
    );
    expect(outcomes.filter(Boolean)).toHaveLength(1);
    expect(await database.consumerReceipt.count()).toBe(1);
    expect(
      (await database.eventProjection.findUniqueOrThrow({ where: { eventType: 'audit.recorded' } }))
        .count,
    ).toBe(1);
  });
  it('rolls back a partially applied consumer and retries the same durable event', async () => {
    const event = await record();
    await expect(
      consumeOnce(database, event.eventId, async (tx, fact) => {
        await applyEventProjection(tx, fact);
        throw new Error('Injected after-effect failure');
      }),
    ).rejects.toThrow('Injected');
    expect(await database.consumerReceipt.count()).toBe(0);
    expect(await database.eventProjection.count()).toBe(0);
    const failed = await database.outboxEvent.findUniqueOrThrow({ where: { id: event.eventId } });
    expect(failed.completedAt).toBeNull();
    expect(failed.failures).toBe(1);
    expect(await consumeOnce(database, event.eventId)).toBe(true);
  });
  it('retains exhausted consumer failures in PostgreSQL instead of silently dropping work', async () => {
    const event = await record();
    for (let i = 0; i < 5; i++)
      await expect(
        consumeOnce(database, event.eventId, async () => {
          throw new Error('Unsupported effect');
        }),
      ).rejects.toThrow();
    const row = await database.outboxEvent.findUniqueOrThrow({ where: { id: event.eventId } });
    expect(row.failedAt).not.toBeNull();
    expect(row.completedAt).toBeNull();
    expect(
      await dispatchPending(database, async () => {
        throw new Error('Should not send');
      }),
    ).toBe(0);
  });
  it('claims each intent once across concurrent dispatchers and recovers a lost enqueue', async () => {
    const event = await record();
    const sent: string[] = [];
    await Promise.all([
      dispatchPending(database, async (id) => {
        sent.push(id);
      }),
      dispatchPending(database, async (id) => {
        sent.push(id);
      }),
    ]);
    expect(sent).toEqual([event.eventId]);
    await database.outboxEvent.update({
      where: { id: event.eventId },
      data: { lastEnqueuedAt: new Date(0), leaseUntil: new Date(0) },
    });
    await dispatchPending(database, async (id) => {
      sent.push(id);
    });
    expect(sent).toEqual([event.eventId, event.eventId]);
  });
  it('rebuilds a lost Redis delivery from PostgreSQL and consumes it through BullMQ', async () => {
    const event = await record();
    const connection = createRedis(process.env.REDIS_URL ?? '', true);
    const workerConnection = createRedis(process.env.REDIS_URL ?? '', true);
    const eventsConnection = createRedis(process.env.REDIS_URL ?? '', true);
    const prefix = process.env.QUEUE_PREFIX ?? 'invalid';
    const name = 'integration-' + randomUUID();
    const queue = new Queue(name, { connection, prefix });
    const queueEvents = new QueueEvents(name, { connection: eventsConnection, prefix });
    const worker = new Worker(
      name,
      async (job) => consumeOnce(database, String(job.data.eventId)),
      { connection: workerConnection, prefix, autorun: false },
    );
    try {
      await queueEvents.waitUntilReady();
      const enqueue = (id: string) => queue.add('deliver', { eventId: id }, { jobId: id });
      await dispatchPending(database, enqueue);
      await (await queue.getJob(event.eventId))?.remove();
      await database.outboxEvent.update({
        where: { id: event.eventId },
        data: { lastEnqueuedAt: new Date(0) },
      });
      await dispatchPending(database, enqueue);
      const job = await queue.getJob(event.eventId);
      if (!job) throw new Error('Replay was not queued');
      const completed = job.waitUntilFinished(queueEvents, 10000);
      void worker.run();
      await completed;
      expect(await database.consumerReceipt.count()).toBe(1);
      expect(
        (
          await database.eventProjection.findUniqueOrThrow({
            where: { eventType: 'audit.recorded' },
          })
        ).count,
      ).toBe(1);
      expect(await consumeOnce(database, event.eventId)).toBe(false);
    } finally {
      await worker.close();
      await queueEvents.close();
      await queue.obliterate({ force: true });
      await queue.close();
      connection.disconnect();
      workerConnection.disconnect();
      eventsConnection.disconnect();
    }
  });
  it('replays a failed queue delivery when the consumer could not persist failure metadata', async () => {
    const event = await record();
    const connection = createRedis(process.env.REDIS_URL ?? '', true);
    const workerConnection = createRedis(process.env.REDIS_URL ?? '', true);
    const eventsConnection = createRedis(process.env.REDIS_URL ?? '', true);
    const prefix = process.env.QUEUE_PREFIX ?? 'invalid';
    const name = 'integration-' + randomUUID();
    const queue = new Queue(name, { connection, prefix });
    const queueEvents = new QueueEvents(name, { connection: eventsConnection, prefix });
    let unavailable = true;
    const worker = new Worker(
      name,
      async (job) => {
        // Model exhausted queue retries while PostgreSQL is unreachable: no durable failure
        // marker can be written, so the dispatcher must still be able to replay the intent.
        if (unavailable) throw new UnrecoverableError('Injected persistence outage');
        return consumeOnce(database, String(job.data.eventId));
      },
      { connection: workerConnection, prefix, autorun: false },
    );
    try {
      await queueEvents.waitUntilReady();
      const enqueue = (id: string) => enqueueOutboxEvent(queue, id);
      await dispatchPending(database, enqueue);
      const first = await queue.getJob(event.eventId);
      if (!first) throw new Error('Delivery was not queued');
      const failure = expect(first.waitUntilFinished(queueEvents, 10000)).rejects.toThrow(
        'Injected persistence outage',
      );
      void worker.run();
      await failure;
      expect(await queue.getJob(event.eventId)).toBeUndefined();
      const pending = await database.outboxEvent.findUniqueOrThrow({
        where: { id: event.eventId },
      });
      expect(pending.failedAt).toBeNull();
      expect(pending.failures).toBe(0);
      await worker.pause();
      unavailable = false;
      await database.outboxEvent.update({
        where: { id: event.eventId },
        data: { lastEnqueuedAt: new Date(0) },
      });
      await dispatchPending(database, enqueue);
      const replay = await queue.getJob(event.eventId);
      if (!replay) throw new Error('Replay was not queued');
      const completion = replay.waitUntilFinished(queueEvents, 10000);
      worker.resume();
      await completion;
      expect(await database.consumerReceipt.count()).toBe(1);
      expect(
        (await database.outboxEvent.findUniqueOrThrow({ where: { id: event.eventId } }))
          .completedAt,
      ).not.toBeNull();
    } finally {
      await worker.close();
      await queueEvents.close();
      await queue.obliterate({ force: true });
      await queue.close();
      connection.disconnect();
      workerConnection.disconnect();
      eventsConnection.disconnect();
    }
  });
});
