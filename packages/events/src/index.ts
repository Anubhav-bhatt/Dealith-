import { z } from 'zod';
import { opaqueId, utcInstant } from '@dealith/validation';
export const eventEnvelope = z
  .object({
    eventId: opaqueId,
    eventType: z.string().regex(/^[a-z_]+\.[a-z_]+$/),
    schemaVersion: z.literal(1),
    occurredAt: utcInstant,
    producer: z.string().min(1).max(64),
    aggregateType: z.string().min(1).max(64),
    aggregateId: opaqueId,
    aggregateVersion: z.number().int().positive(),
    securityScope: z.object({ kind: z.literal('platform') }).strict(),
    actor: z.object({ kind: z.literal('service'), id: z.literal('platform-foundation') }).strict(),
    correlationId: opaqueId,
    causationId: opaqueId.nullable(),
    requestId: opaqueId,
    traceparent: z
      .string()
      .regex(/^00-(?!0{32}-)[a-f0-9]{32}-(?!0{16}-)[a-f0-9]{16}-0[01]$/)
      .optional(),
    policyVersion: z.literal(1),
    payload: z.object({ auditId: opaqueId }).strict(),
  })
  .strict();
export type PlatformEvent = z.infer<typeof eventEnvelope>;
// Additional domain payloads/scopes require their owning phase's reviewed schemas.
export function parsePlatformEvent(value: unknown): PlatformEvent {
  const event = eventEnvelope.parse(value);
  if (
    event.eventType !== 'audit.recorded' ||
    event.producer !== 'Audit' ||
    event.aggregateType !== 'AuditEvent' ||
    event.aggregateId !== event.payload.auditId
  )
    throw new Error('Unsupported platform event');
  return event;
}
