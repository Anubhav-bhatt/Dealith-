import { randomUUID } from 'node:crypto';
import type { PlatformEvent } from '@dealith/events';
export function platformEvent(): PlatformEvent {
  const auditId = randomUUID();
  return {
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
    correlationId: randomUUID(),
    causationId: null,
    requestId: randomUUID(),
    policyVersion: 1,
    payload: { auditId },
  };
}
