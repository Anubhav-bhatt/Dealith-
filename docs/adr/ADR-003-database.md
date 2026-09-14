# ADR-003: PostgreSQL and Prisma

Status: Recorded baseline, 2026-09-07. Sources: master §§49, 51, 73, 93. Implementation begins PHASE-01.

## Context and decision

Use PostgreSQL as the authoritative store and Prisma as the typed persistence adapter. Module-owned repositories enforce explicit ownership and participant relationships. PostgreSQL constraints and transactions protect uniqueness, immutable evidence references, version checks, exact decimal money and audit/outbox atomicity. Store UTC instants and explicit currencies/precision. Redis and search cannot establish financial or permission truth.

The [data model](../DATA_MODEL.md) is conceptual in Phase 0. Phase 1 pins versions and creates reviewed migrations; Phase 2 verifies transaction-local tenant/security context with real PostgreSQL and no application superuser/BYPASSRLS access. Database policies supplement server authorization under [ADR-015](ADR-015-multi-tenancy.md). External network calls never hold a transaction open. Immutable offer/agreement/financial records use correction references rather than destructive edits.

## Alternatives and consequences

A document database makes cross-aggregate constraints and reconciliation less direct. Floating-point money or SQLite integration substitutes cannot verify the required arithmetic and PostgreSQL concurrency behavior. Direct frontend persistence is rejected. Prisma does not eliminate SQL review: constraints, RLS, indexes and locking may need explicit SQL migrations and narrow audited adapters.

## Verification and revisit

PHASE-01 tests migrations on clean and previous schemas, transactional rollback/outbox and restore; later phases test stale versions, concurrency and exact monetary conversion. Use expand/contract migrations and compatible application rollback; destructive changes require reviewed recovery evidence. Revisit engine or partitioning only with measured load/operational requirements and a reconciliation-safe migration plan.
