# Deployment architecture

Status: frozen deployment and recovery design; nothing has been deployed in Phase 0. Target infrastructure: [infrastructure](INFRASTRUCTURE.md). Delivery gates: [CI/CD](CI_CD.md).

## Deployable boundaries

| Deployable | Responsibility | Persistence / scale |
|---|---|---|
| `apps/web` | Public SSR/SEO and founder/buyer/deal workspaces; same-origin API proxy | Stateless Next.js instances; only public projections cacheable |
| `apps/admin` | Separate operations origin, MFA-protected admin sessions, scoped administration | Stateless Next.js instances; no direct DB/provider access |
| `apps/api` | NestJS modular monolith, authorization, commands/queries, webhook verification | Horizontal replicas share PostgreSQL durable state; no in-memory authoritative locks |
| `apps/worker` | Outbox publication, domain consumers, notifications, scans, indexing, AI, reconciliation | Independent pools/queues and least-privilege task roles; CAS/idempotency for concurrent work |
| Migration task | Reviewed Prisma migration execution once per deployment | Short-lived elevated DB role; never run migrations on every API task boot |
| Collector | OpenTelemetry ingestion/export/redaction | Independent telemetry availability; domain audit remains DB durable |

All deployables build from a pnpm workspace and compatible contracts/events. This is a modular monolith with workers, not independent microservices owning competing databases. Multiple replicas do not bypass aggregate concurrency controls. Provider credentials exist only in entitled backend tasks. Webhook signatures bind to raw request bytes before parsing/normalization. Timeouts and retries are explicitly bounded at browser proxy, ALB, API and provider adapter layers.

## Release and migration order

1. Build once from reviewed commit; retain image digests, SBOM, provenance, dependency scan, test evidence and contract/schema versions.
2. Generate a reviewed Terraform plan separately from application changes. Apply only to the intended environment using isolated state and temporary deploy identity. No automatic production resource creation in Phase 0.
3. Validate expand/contract migration against a representative previous schema and dataset; record expected lock duration, backup/PITR status, forward-fix and rollback compatibility. Destructive contraction waits for all old readers/writers and worker payloads to expire.
4. Run the one-shot migration task with deployment lock. Stop on failure; never ignore a partial migration or edit production schema manually.
5. Deploy compatible worker/API code, then frontend/admin, with rolling health checks and capacity for old/new overlap. Readers tolerate additive contracts; event schema versions must remain supported during rolling upgrades.
6. Execute environment smoke and scenario gates; promote the identical digest through staging → pre-production → production. Canary/weighted rollout begins with nonfinancial cohorts. New settlement adapters stay disabled until reconciliation and provider gating pass.
7. Monitor availability, latency, queues, invariant checks and provider callbacks. Revert compatible application images or forward-fix; do not blindly roll back database state or replay external financial calls.

Feature flags are server-evaluated controls with environment/org scopes, owners, expiry/review date and audited changes. They can disable initiation, AI, ranking, crypto, regulated investments or provider routing, but cannot erase funded obligations, bypass authorization, mute audit or fake provider results. Incident flags suspend new financial mutations while retaining read/status/reconciliation capability.

## Health and failure semantics

Liveness verifies process health without recursively testing every provider. Readiness verifies the dependencies required for safe acceptance (database/session state and schema compatibility), allowing AI/search/email degradation to be surfaced independently. Workers expose heartbeat, queue age and checkpoint health. Failing the health of an optional provider must not kill healthy API replicas. Dependency timeouts return safe stable error codes and request IDs; unknown financial outcomes stay pending/manual-review rather than being retried as new operations.

Graceful shutdown stops accepting new requests/jobs, drains within a bounded deadline, and leaves durable jobs retryable. A failed publisher can resume from the outbox; a Redis rebuild replays unacknowledged durable jobs. CDN caches and search indexes are derived; they can be rebuilt from approved public projections. Suspended/private content is denied at the origin immediately and purged from projections; failure to purge is a security incident.

## Backup, restore and disaster recovery

These are initial engineering recovery objectives, not measured guarantees. Phase 15 must demonstrate them or record and resolve an explicit launch-blocking deviation.

| Asset / failure | Target RPO | Target RTO | Recovery and proof |
|---|---|---|---|
| Regional PostgreSQL failure / ordinary restore | ≤5 minutes for general application data | ≤4 hours | Encrypted automated backups + PITR; restore into isolated environment; constraints, ownership, event and audit consistency checks |
| Committed financial instructions and required audit | 0 loss accepted as correctness requirement | ≤4 hours target for safe investigation/read access; financial writes stay disabled until reconciled | Durable operation IDs, provider records, protected audit evidence and backups reconciled; never imply a general 5-minute DB RPO permits silent money/audit loss |
| Document/version objects | 0 loss of acknowledged durable originals within regional storage design; disaster-copy lag target ≤15 minutes if approved | ≤8 hours for authorized document access | S3 versioning, protected deletion and integrity manifests; approved replication only within residency policy; hold/version/content-hash tests |
| Redis/derived search/cache | Rebuildable; no unique financial/business state | ≤1 hour | Rebuild from DB/outbox; fail closed for sessions/grants; rehydrate queues idempotently |
| Regional disaster requiring alternate region | ≤15 minutes for approved replicated application backup; financial/audit reconciliation still zero-loss requirement | ≤24 hours target | Secondary region chosen only after residency review; Phase 15 either demonstrates approved recovery path or keeps launch blocked for this target |

Zero-loss financial/audit acceptance is an invariant to verify, not a claim that a single regional database backup guarantees zero RPO. Before launch choose and test a durable recovery design that can account for every acknowledged committed financial operation and audit event (including protected replicated audit evidence and provider reconciliation). If any acknowledged record cannot be recovered or explained, recovery is incomplete; keep writes disabled and escalate. Infrastructure implementation must provide evidence for this gate.

Restore runbook sequence: declare incident and freeze mutations → preserve logs/provider identifiers → restore approved DB point and object manifests → rotate/restrict compromised credentials if relevant → reconcile users/memberships/revocations/legal holds → invalidate sessions/caches/signed access where possible → replay outbox/consumer checkpoints idempotently → reconcile every unknown/funded/release/refund operation with provider → verify immutable agreement/transfer evidence and audit continuity → execute tenant/security/financial smoke → dual-reviewed reopening of financial writes. A successful HTTP health check is not sufficient.

Perform automated backup checks daily, isolated restore exercises quarterly and after material persistence changes, and an end-to-end financial restore before live settlement. Retain measured timings, uncovered gaps, responsible owners and sign-off. Region/residency and provider recovery details are launch-gated configuration decisions, not permission to choose a jurisdiction or provision accounts in Phase 0.

## Operational readiness

Phase 1 establishes nonproduction deployments and migration/rollback harnesses. Later phases add domain dashboards and runbooks as their features arrive. Phase 15 requires on-call rota, incident severity policy, provider contacts, key rotation, independent security assessment, recovery evidence, capacity benchmark, abuse controls and tested support escalation. Production changes are separately approved in the protected deployment environment; a Phase 0 PASS authorizes Phase 1 planning/foundation work only.
