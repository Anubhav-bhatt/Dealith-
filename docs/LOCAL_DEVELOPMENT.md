# Local development

The local foundation runs web, admin, API and worker as four processes. Only platform health/version, runtime certification screens and synthetic audit-event delivery are implemented. See the [Phase 1 report](phases/PHASE_01_REPORT.md) for measured results.

## Prerequisites

Use Node 24.19.0 (or a compatible Node 24 patch), pnpm 11.24.0 and Python 3.9+. The repository pins versions in `.node-version`, `.nvmrc` and [package.json](../package.json). The tested native database version is PostgreSQL 15.19; Redis is 8.10.1. `initdb`, `pg_ctl`, `pg_dump`, `pg_restore` and `redis-server` must be on PATH. On Homebrew systems, the PostgreSQL bin directory may need adding to PATH. PostgreSQL cannot initialize as the root OS user.

```sh
node --version
pnpm --version
initdb --version
redis-server --version
pnpm install --frozen-lockfile
pnpm dev:local
```

`dev:local` generates Prisma, builds shared packages, creates a temporary PostgreSQL cluster/database and Redis process bound to loopback, applies the migration, grants a separate restricted application role, then starts all apps. Native temporary PostgreSQL uses trust authentication on loopback for this synthetic session; do not use this mode on a shared or exposed host. No provider secrets or `.env` are needed. Ctrl-C stops the processes and removes their temporary data. A forced OS kill can leave a temporary directory/process; use its printed process/path evidence to identify it rather than deleting unrelated databases or Redis data.

| Process | URL | Behavior |
|---|---|---|
| Web | `http://localhost:3000` | Web runtime certification |
| Admin | `http://localhost:3001` | Admin runtime certification; no privileged functions |
| API | `http://127.0.0.1:4000/api/v1/health` | Independent liveness; `/api/v1/readiness` checks schema/Redis; `/api/v1/version` returns safe metadata |
| Worker | `http://127.0.0.1:4001/health/live` | Independent liveness; `/ready` requires persistence, Redis and a recent successful dispatcher poll |

Ports 3000/3001/4000/4001 must be free; temporary PostgreSQL/Redis choose unused ports. Use `LOCAL_PORT_BASE=3200 pnpm dev:local` to move web/admin to 3200/3201 and API/worker to 4200/4201 without disturbing a conflicting service. The runner fails if an app exits and stops its siblings. App sources watch in development; after changing a shared package, run `pnpm build:packages` and restart the affected processes. No seed listing, staff account or transaction is created.

## Verification

Install the browser once, then run the complete local check:

```sh
pnpm exec playwright install chromium
pnpm verify
```

This runs document validation and mutation tests, format, Prisma generation, all package/app builds, OpenAPI snapshot comparison, ESLint/import boundaries, strict TypeScript, development-supervisor shutdown tests, unit/component/contract tests, real PostgreSQL/Redis integration tests, desktop/mobile Chromium tests and the four-process recovery smoke test. Socket permissions are required. `test:e2e` uses web/admin ports 3100/3101 and real API/worker ports 4100/4101 with isolated migrated PostgreSQL/Redis. It refuses to reuse existing servers. Every desktop/mobile case runs, including keyboard and axe checks. `test:smoke` chooses its own app ports and saves UI screenshots under ignored `test-results/foundation/`.

Individual checks are in [package.json](../package.json). Build before running tests that import compiled packages. Use `pnpm contracts:generate` after intentionally changing the implemented health contracts, then review [platform.openapi.json](contracts/platform.openapi.json). This document lists only implemented routes; the larger product [API catalog](API_BOUNDARIES.md) remains a design contract.

`pnpm test:integration` can alternatively use explicitly supplied `TEST_DATABASE_ADMIN_URL` and `TEST_REDIS_URL` for dedicated test services. The migration role needs database/role creation rights. The harness creates a unique database and restricted role and drops only those resources on exit. Never point these variables at production or shared business services. The native recovery smoke test refuses external test URLs because it deliberately stops and restarts its own Redis instance.

## Persistent local services and optional containers

A [Compose definition](../compose.yaml), [Dockerfile](../Dockerfile) and synthetic [role initialization](../infra/local/init-db.sql) are provided for a persistent local setup. Docker was unavailable during implementation, so container builds/runtime are **not verified**. Native execution above is the tested path.

When Docker is available, `docker compose up --build` should build the four processes, migrate with a separate owner and grant the restricted runtime role. PostgreSQL and Redis volumes persist across `docker compose down`. All host ports bind loopback. Credentials in this definition are synthetic local defaults; the multistage Dockerfile has separate nonroot API, worker and standalone web/admin runtime targets. Only the separate migration target retains build/migration tooling. Container execution must still verify image availability, Linux build, runtime grants, health and shutdown before relying on it.

To run native apps against those persistent services instead, start only `postgres`, `redis` and `migrate` with Compose, copy [.env.example](../.env.example) to `.env`, run `pnpm build`, then `pnpm dev`. `pnpm start:api`, `start:worker`, `start:web` and `start:admin` run the compiled processes separately. Next starts the generated standalone server; the build copies required static assets. Use `PORT` or the positional port of `tools/start-next.mjs` for an alternate web port. `WEB_ORIGIN`, `ADMIN_ORIGIN`, `API_INTERNAL_ORIGIN` and `WORKER_INTERNAL_ORIGIN` are validated runtime values; web/admin proxy only fixed health routes. Required web configuration is checked at startup; malformed values fail with field names only. WEB_PORT/ADMIN_PORT override the default web listeners.

## Delivery and recovery semantics

The application role can insert/read audit evidence and receipts and update outbox delivery metadata/projections. It cannot mutate audit rows, own schema tables, create schema objects, bypass RLS or act as superuser. Migration triggers also protect accepted outbox fact fields. There are no tenant/domain rows yet; this does not claim tenant isolation before Phase 2.

Accepted audit evidence and its outbox event commit atomically. Dispatch uses PostgreSQL row leases and stable event IDs. Redis contains delivery references, while PostgreSQL retains intent. A receipt, projection effect and completed marker commit in one transaction. Unacknowledged leases expire after 15 seconds; unresolved acknowledged deliveries become eligible again after 30 seconds. Duplicate delivery has one local effect. Five consumer failures retain a durable failed marker for later scoped operator recovery; no automatic dead-letter clearing or operator API is provided. Exhausted BullMQ jobs are removed so a database outage that prevents recording failure cannot permanently block pending intent from replaying with its original event ID.

`test:smoke` stops disposable Redis, verifies 503 readiness and surviving liveness, restores connectivity, restarts the worker after complete queue loss and verifies one committed effect. It also dumps the four platform tables and restores them into a separate freshly migrated database. This is a synthetic local restore, not a full production backup, point-in-time recovery or measured production RPO/RTO exercise. Do not run direct database replay/repair against real business records.

GitHub Actions is authored but has not run remotely; no repository remote, branch protection, AWS account or deployment is configured. See [CI/CD](CI_CD.md), [ADR-017](adr/ADR-017-local-foundation.md) and the phase report for follow-up gates.

## Additional certification commands

`pnpm infra:up` starts persistent Docker PostgreSQL/Redis and waits for health; `pnpm infra:down` stops Compose without deleting volumes. Run `docker compose run --rm migrate` to apply migrations and restricted grants, or follow the native disposable workflow above. `pnpm db:generate`, `db:migrate` and `db:status` require appropriate environment values for persistent services. Migration commands use MIGRATION_DATABASE_URL; API/worker use the restricted DATABASE_URL. Never edit an applied migration; add a forward migration, rehearse it from empty and prior schema, and restore a verified backup for destructive recovery.

`pnpm test:clean-install` copies source into a fresh temporary directory without node_modules/build/generated files, performs a frozen registry install into a fresh package store and metadata cache, builds and runs tests/browser/recovery against fresh isolated services. Registry access and the documented installed Chromium prerequisite are required. The first offline attempt revealed missing pnpm security-policy metadata; this harness now checks the actual fresh-registry setup. `pnpm test:benchmark` records 200 loopback samples per health/readiness route at concurrency five after 20 warmups. Both write summaries under ignored test-results/foundation. Neither is production certification.

Set OTEL_ENABLED=true and OTEL_EXPORTER_OTLP_TRACES_ENDPOINT / OTEL_EXPORTER_OTLP_METRICS_ENDPOINT to a trusted local collector's HTTP ingestion URLs. Missing endpoints discard export; false disables the SDK. No paid service is required. Unit coverage uses a local OTLP HTTP sink to verify export and correlation. LOG_LEVEL is debug/info/warn/error; HTTP completion emits info, service/worker failures emit error. Payloads, raw URLs, headers and exception contents are excluded. The public certification page exposes only APP_ENV and safe status, never service URLs or credentials.

Security: exact CORS origin allowlist (defaults to WEB_ORIGIN/ADMIN_ORIGIN), no wildcard. CORS is browser transport control, not authentication. Dynamic Next pages use a fresh script nonce; production omits unsafe-eval. Development allows eval/websocket tooling. Inline styles remain allowed for framework CSS; no untrusted content is rendered. HTTPS production responses include HSTS; local HTTP API responses do not. No user authentication or permission substitute exists yet.

Troubleshooting: a missing Docker binary means use dev:local or install/start Docker yourself; no Docker runtime result is claimed. EPERM opening sockets is an execution-environment permission issue. Port-in-use failures stop the supervisor; choose LOCAL_PORT_BASE explicitly. A 503 readiness response means schema/database/Redis is not ready, while liveness can remain 200. Regenerate Prisma/build shared packages after changing their source; do not reuse stale compiled contracts. Native PostgreSQL initialization must run as a non-root OS user.
