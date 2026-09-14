# ADR-011: Transactional outbox with idempotent effects

Status: Recorded baseline, 2026-09-07. Sources: master §§47, 53–54, 59–61, 93. Foundation begins PHASE-01.

## Context and decision

Commit domain mutation, required audit and outbox event in the same PostgreSQL transaction. Publish through a durable delivery ledger to Redis/BullMQ workers. Use at-least-once delivery; consumers deduplicate by stable event/consumer identity and commit receipts with their local effects. Queue loss/restart rehydrates work from authoritative records. Per-aggregate sequence/version handles ordered projections without imposing false global ordering.

The versioned [event catalog](../DOMAIN_EVENTS.md) owns names, schemas, producers/consumers and privacy classifications. Envelopes carry event ID, schema version, aggregate/version, occurred time, correlation/causation, actor context and safe references. Do not publish signed URLs, passwords, raw KYC or document/source contents. Audit is unsampled and separate from operational telemetry. Slow provider work consumes durable operation IDs and applies [ADR-009](ADR-009-escrow-provider.md), not a naive queue retry.

## Alternatives and consequences

Publishing directly after a database write loses events on process crash; publishing first creates phantom events on rollback. Exactly-once delivery claims obscure network ambiguity. Database outbox adds retention, locking, retries, lag metrics and replay operations, but makes committed intent recoverable. Bounded retries and dead-letter cases need assigned owners and safe replay tooling.

## Verification and revisit

PHASE-01 exercises rollback, publisher crash, consumer crash-before/after-commit, duplicate delivery and Redis loss. Later phases verify no duplicate messages, state transitions, audit loss or financial effect. PHASE-15 proves restore replay and reconciliation with recorded evidence. New brokers require schema/order/replay compatibility and justified capacity evidence.
