> Historical report for the earlier, narrower local scope. Superseded for current acceptance by [Phase 1 report](PHASE_01_REPORT.md).

# Phase 01 report

Date: 2026-09-09. Verdict: **PASS — selected Phase 1 local foundation scope**. The scope is the user's recorded selection, “Finish the local foundation first,” in the [plan](PHASE_01_PLAN.md). The local requirements and checks pass; the external deployment, remote CI and independent-review gates listed below remain unclaimed.

Authority: [requirements](PHASE_01_REQUIREMENTS.md), [test matrix](PHASE_01_TEST_MATRIX.md), [ADR-017](../adr/ADR-017-local-foundation.md) and the unchanged [master scope](../../DEALITH_MASTER_PROJECT_SCOPE.md). Reproduce the local commands using the [development guide](../LOCAL_DEVELOPMENT.md).

## Delivered local foundation

Four independently built applications run as web, admin, API and worker. Twelve shared packages enforce declared dependencies, browser/server boundaries and an acyclic workspace graph. Exact dependency pins, the lockfile and separate runtime/public configuration support reproducible builds. Web and admin provide responsive development shells with semantic status, keyboard navigation and unavailable product capabilities clearly identified.

The API implements versioned liveness/readiness contracts, server-owned request IDs, safe errors, bounded JSON ingress and private no-store responses. PostgreSQL migrations create AuditEvent, OutboxEvent, ConsumerReceipt and EventProjection. Audit evidence and accepted delivery intent commit atomically; database leases, stable event IDs, transactional receipts and a rebuildable projection support concurrent delivery and recovery. The runtime database role is distinct from the migration role and cannot mutate audit evidence or outbox fact fields.

The worker uses Redis/BullMQ for delivery references and PostgreSQL for durable intent and retry exhaustion. Structured logging drops confidential content; optional OTLP trace export is configurable. The native service harness creates isolated disposable PostgreSQL/Redis resources, migrates them, and cleans up after verification or development. Optional Docker/Compose and GitHub Actions definitions are authored.

## Continuation fixes

Review found that retained failed BullMQ jobs could indefinitely block replay of their stable event IDs when a database outage prevented recording consumer failure. Failed queue jobs are now removed so pending PostgreSQL intent can be enqueued again; durable exhausted intents remain retained in PostgreSQL. A real-service regression covers failure, removal, replay with the same ID and exactly one committed receipt/projection effect.

The development supervisor now stops every application process group, waits for live descendants to exit, and treats an unexpected successful app exit as a failed development session. The local runner waits for the supervisor before removing temporary services, tolerates repeated terminal signals and preserves shutdown failures. Three regression cases verify app exits with codes 0 and 23 and repeated Ctrl-C shutdown.

Malformed configuration URLs could previously throw a native URL error containing the raw credential-bearing input. Nonthrowing URL validation now preserves the field-only configuration error in test and production modes; unit coverage exercises all five service/origin URL fields. The existing API formatting failure was also corrected.

## Verification evidence

Environment: macOS arm64, Node 24.19.0, pnpm 11.24.0, Python 3.9.6, PostgreSQL 15.19 and Redis 8.10.1. Next 16.3.4, React 19.2.8, Nest 12.0.1, Prisma 7.10.0 and TypeScript 6.0.3 are pinned in the workspace.

`pnpm install --frozen-lockfile --offline` passed against the available local dependency store. `pnpm audit --prod` queried the registry and reported 0 known vulnerabilities across 485 resolved production/optional dependencies. The complete `pnpm check` command passed after the continuation fixes.

| Verification | Observed result |
|---|---|
| Documents | PASS: 104 master sections, 17 ADRs, 62 Markdown files and 391 local links; 12 mutation/failure tests passed |
| Formatting, contracts and boundaries | PASS: Prettier clean; OpenAPI snapshot matched; ESLint and the 16-project dependency/browser-server boundary checker passed |
| Build and types | PASS: Prisma client generated; all 16 included workspace projects built and passed strict TypeScript checks; web/admin production builds completed |
| Supervisor | PASS: 3 tests covered unexpected child exit 0, child exit 23 and repeated Ctrl-C with complete process-tree shutdown |
| Unit/component/contract | PASS: 7 unit, 2 component and 5 assembled API contract tests |
| PostgreSQL/Redis integration | PASS: 9 cases using a freshly migrated isolated PostgreSQL database, restricted runtime role and isolated Redis namespace |
| Browser | PASS: 5 desktop/mobile Chromium cases; the physical-keyboard case passed on desktop and was intentionally skipped on the mobile profile |
| Recovery smoke | PASS: four production processes and health proxies; Redis outage/readiness recovery; worker restart and total queue-loss replay; separate migrated-database restore; graceful shutdown |
| Documented development command | PASS: `LOCAL_PORT_BASE=3300 pnpm dev:local` started all four development processes; their six page/readiness probes returned 200; Ctrl-C stopped the apps, released all four ports and removed the disposable data directory |

The recovery smoke screenshots are generated under ignored `test-results/foundation/`. The tests use synthetic platform audit events only; no account, listing, transaction or provider data is present. The initial continuation run exposed the formatting, queue replay and shutdown issues described above, so only the final clean run is the acceptance result.

## Remaining delivery gates

These items remain outside the selected local completion scope; none is reported as passed or as approved by a human reviewer.

| Gate | Owner | Reason and impact | Required next evidence |
|---|---|---|---|
| Docker/Compose and Linux parity | Platform | Docker is unavailable locally; container definitions have not run | Build images, start all services, verify migration/runtime grants, health and shutdown on Linux |
| Remote CI and repository protection | Repository maintainer | Git is initialized on `main` with no commits or configured remote | Select the target repository, run the authored workflow, configure required checks and record its result |
| Terraform and nonproduction deployment | Platform/SRE | Terraform, an AWS target and deployment access are absent | Establish the target environment and delivery plan; implement/validate infrastructure, deploy and record smoke/rollback evidence |
| External telemetry and operational readiness | SRE | No Collector, alert destination or operational environment is configured | Verify exported traces, alerts, workload baselines and environment-specific backup/recovery |
| Independent security/accessibility and owner review | Security/design/phase owner | Local engineering checks are bounded evidence | Complete the applicable independent assessments and owner reviews before the relevant release gate |

Identity, organizations, tenant authorization, registration, listings, transactions and provider integrations remain subsequent product phases. No production resource, real-money capability or deployment is enabled. The synthetic platform restore does not establish production point-in-time recovery, RPO or RTO. The broader [phase acceptance matrix](../PHASE_ACCEPTANCE_MATRIX.md) and [Definition of Done](../DEFINITION_OF_DONE.md) remain in force for their applicable delivery gates.
