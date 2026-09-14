import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parsePlatformEvent } from '@dealith/events';
import { platformEvent } from '@dealith/test-kit';
import { safeLogFields } from '@dealith/security/server';
describe('safe event and telemetry boundaries', () => {
  it('rejects forged scope, event types and mismatched evidence before delivery', () => {
    const event = platformEvent();
    expect(parsePlatformEvent(event).eventId).toBe(event.eventId);
    expect(() => parsePlatformEvent({ ...event, eventType: 'settlement.released' })).toThrow();
    expect(() =>
      parsePlatformEvent({ ...event, securityScope: { kind: 'organization', id: randomUUID() } }),
    ).toThrow();
    expect(() => parsePlatformEvent({ ...event, payload: { auditId: randomUUID() } })).toThrow();
    expect(() =>
      parsePlatformEvent({ ...event, payload: { ...event.payload, token: 'secret' } }),
    ).toThrow();
  });
  it('drops content, headers, URLs and hostile metadata from operational logs', () => {
    const requestId = randomUUID();
    expect(
      safeLogFields({
        requestId,
        status: 503,
        durationMs: 42,
        cookie: 'session=secret',
        authorization: 'secret',
        body: 'private document',
        url: 'https://s3.example/?signature=secret',
        eventId: 'password=secret',
        count: NaN,
      }),
    ).toEqual({ requestId, status: 503, durationMs: 42 });
  });
});
