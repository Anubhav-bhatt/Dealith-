# ADR-001: Modular monolith

Status: Recorded baseline, 2026-09-07. Sources: master §§3, 48, 52, 93. Implementation begins PHASE-01.

## Context and decision

Dealith needs strong transaction and authorization guarantees across a broad product before it has measured service scaling needs. Use one NestJS modular backend and shared PostgreSQL data model, with API and worker as separate execution processes. Next.js web and admin are separate rendering applications. Module ownership, public application interfaces and dependency rules are mandatory from the first scaffold.

Each domain owns its writes; controllers cannot query another domain's repository. A narrow coordinator may share one database transaction among owning application services for accepted-offer reservation, audited state change and other immediate invariants. Search, analytics and notifications consume durable events. Provider calls execute after durable intent commits and outside database locks. See [architecture](../MASTER_ARCHITECTURE.md) and [domain map](../PRODUCT_DOMAIN_MAP.md).

## Alternatives and consequences

Microservices add distributed transactions, deployment and reconciliation overhead before evidence justifies them. An unstructured monolith makes permissions and future extraction unsafe. The selected approach minimizes operational units while keeping explicit seams; it does not make extraction automatic. A future service requires a measured scaling/team/compliance reason, data ownership, versioned contracts, reservation protocols replacing shared transactions, replay/backfill, cutover and rollback ADR.

## Verification and revisit

PHASE-01 proves import restrictions, build separation and API/worker composition; integration tests reject unauthorized cross-module access and prove atomic audit/outbox. Revisit when measured bottlenecks or ownership boundaries cannot be resolved within the process model, not because a domain acquires more endpoints.
