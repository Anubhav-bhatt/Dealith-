import { randomUUID } from 'node:crypto';
import { parsePlatformEvent, type PlatformEvent } from '@dealith/events';
import { inSpan, captureTraceContext } from '@dealith/observability/server';
import { Prisma, type Database } from './database.js';
export const consumerName = 'platform.event-count.v1';
export type Transaction = Prisma.TransactionClient;
export async function recordAuditInTransaction(
  tx: Transaction,
  requestId: string,
  action: 'platform.started' | 'platform.probe',
) {
  const auditId = randomUUID();
  const { traceparent } = captureTraceContext();
  const event = parsePlatformEvent({
    eventId: randomUUID(),
    eventType: 'audit.recorded',
    schemaVersion: 1,
    occurredAt: new Date().toISOString(),
    producer: 'Audit',
    aggregateType: 'AuditEvent',
    aggregateId: auditId,
    aggregateVersion: 1,
    securityScope: { kind: 'platform' },
    actor: { kind: 'service', id: 'platform-foundation' },
    correlationId: requestId,
    causationId: null,
    requestId,
    ...(traceparent ? { traceparent } : {}),
    policyVersion: 1,
    payload: { auditId },
  });
  await tx.auditEvent.create({ data: { id: auditId, action, requestId } });
  await tx.outboxEvent.create({
    data: { id: event.eventId, auditEventId: auditId, eventType: event.eventType, envelope: event },
  });
  return event;
}
export async function dispatchPending(
  database: Database,
  enqueue: (eventId: string, traceContext: Record<string, string>) => Promise<unknown>,
  limit = 25,
): Promise<number> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw new Error('Invalid dispatch batch size');
  return inSpan('outbox.dispatch', async () => {
    const leaseToken = randomUUID();
    const rows = await database.$queryRaw<Array<{ id: string; envelope: unknown }>>(Prisma.sql`
      WITH pending AS (
        SELECT id FROM "OutboxEvent"
        WHERE "completedAt" IS NULL AND "failedAt" IS NULL
          AND ("leaseUntil" IS NULL OR "leaseUntil" < now())
          AND ("lastEnqueuedAt" IS NULL OR "lastEnqueuedAt" < now() - interval '30 seconds')
        ORDER BY "createdAt", id FOR UPDATE SKIP LOCKED LIMIT ${limit}
      ) UPDATE "OutboxEvent" AS target
      SET "leaseUntil" = now() + interval '15 seconds', "leaseToken" = ${leaseToken}::uuid,
          attempts = attempts + 1
      FROM pending WHERE target.id = pending.id RETURNING target.id, target.envelope
    `);
    let count = 0;
    let enqueueFailed = false;
    for (const row of rows) {
      try {
        const event = parsePlatformEvent(row.envelope);
        await enqueue(row.id, event.traceparent ? { traceparent: event.traceparent } : {});
        await database.outboxEvent.updateMany({
          where: { id: row.id, leaseToken },
          data: { lastEnqueuedAt: new Date(), leaseUntil: null, leaseToken: null },
        });
        count++;
      } catch {
        enqueueFailed = true;
        // A send may already have succeeded. Preserve intent and reuse the same event ID after the lease.
        // Do not claim delivery or permanently fail an event because Redis is unavailable.
      }
    }
    if (enqueueFailed) throw new Error('Outbox enqueue unavailable');
    return count;
  });
}
export async function applyEventProjection(tx: Transaction, event: PlatformEvent): Promise<void> {
  await tx.eventProjection.upsert({
    where: { eventType: event.eventType },
    create: { eventType: event.eventType, count: 1 },
    update: { count: { increment: 1 } },
  });
}
export async function consumeOnce(
  database: Database,
  eventId: string,
  apply = applyEventProjection,
): Promise<boolean> {
  return inSpan('outbox.consume', async () => {
    try {
      return await database.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<Array<{ envelope: unknown; failedAt: Date | null }>>(
          Prisma.sql`SELECT envelope, "failedAt" FROM "OutboxEvent" WHERE id = ${eventId}::uuid FOR UPDATE`,
        );
        const row = rows[0];
        if (!row || row.failedAt) throw new Error('Event unavailable');
        const receipt = await tx.consumerReceipt.findUnique({
          where: { eventId_consumer: { eventId, consumer: consumerName } },
        });
        if (receipt) return false;
        const event = parsePlatformEvent(row.envelope);
        if (event.eventId !== eventId) throw new Error('Event identity mismatch');
        await apply(tx, event);
        await tx.consumerReceipt.create({ data: { eventId, consumer: consumerName } });
        await tx.outboxEvent.update({
          where: { id: eventId },
          data: { completedAt: new Date(), lastErrorCode: null },
        });
        return true;
      });
    } catch (error) {
      // Persist the failure separately, after the effect/receipt transaction has rolled back.
      await database.$executeRaw(Prisma.sql`UPDATE "OutboxEvent" SET failures = failures + 1,
        "lastErrorCode" = 'CONSUMER_FAILED', "failedAt" = CASE WHEN failures + 1 >= 5 THEN now() ELSE "failedAt" END
        WHERE id = ${eventId}::uuid AND "completedAt" IS NULL`);
      throw error;
    }
  });
}

/** Persistence port for infrastructure events; callers pass an existing transaction for atomicity. */
export interface OutboxPublisher {
  publish(eventId: string, traceContext: Record<string, string>): Promise<unknown>;
}
export class OutboxRepository {
  constructor(private readonly database: Database) {}
  record(tx: Transaction, requestId: string, action: 'platform.started' | 'platform.probe') {
    return recordAuditInTransaction(tx, requestId, action);
  }
  dispatch(publisher: OutboxPublisher, limit = 25) {
    return dispatchPending(
      this.database,
      (id, traceContext) => publisher.publish(id, traceContext),
      limit,
    );
  }
}
