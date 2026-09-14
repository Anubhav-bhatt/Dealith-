# ADR-017: Local foundation toolchain and verification

Status: Implemented local amendment, 2026-09-08. Author: repository implementation agent. User scope evidence: “Finish the local foundation first.” No human architecture review, remote CI execution or deployment approval is asserted.

## Context

The Phase 0 baseline defines four processes, a pnpm workspace, PostgreSQL/Prisma, Redis/BullMQ, Jest backend tests and local containers. The selected NestJS 12 package is ESM. Native PostgreSQL and Redis are installed locally; Docker and Terraform are absent. The user selected local completion before repository targeting or AWS nonproduction delivery.

## Decision

Use Node 24.19.0, pnpm 11.24.0, Next 16.3.4, React 19.2.8, Nest 12.0.1, Prisma 7.10.0 and TypeScript 6.0.3. Exact direct versions and the resolved graph are authoritative in `package.json` and `pnpm-lock.yaml`. TypeScript 6 remains within the installed TypeScript ESLint parser's supported range. Prisma stays on its stable 7 release. Use Vitest 4.1.11 across backend/shared/component/contract suites, with real PostgreSQL 15.19 and Redis 8.10.1 integration tests; Playwright 1.63.0 verifies Chromium desktop and mobile viewports.

This explicitly amends the Jest/Testcontainers runner choice in master §§63–70 and the Phase 0 test strategy. Native isolated instances provide the local transaction/restart evidence; the CI definition accepts isolated databases/namespaces on dedicated service containers. No SQLite substitute or mock database is used for persistence invariants. The optional local Compose definition remains unexecuted until Docker is available.

Implement only platform `audit.recorded`, with its audit row and outbox in one transaction, immutable fact fields, an atomic consumer receipt and a rebuildable `EventProjection` counter. The latter is an operational testable projection, has no financial authority and extends the conceptual catalog. The other documented domains/events remain future contracts.

## Alternatives and consequences

Adding a second Jest runner solely for Nest would duplicate ESM configuration without improving the tested invariants. Blocking local evidence on absent Docker would prevent using the real native services already available. Native service tests need PostgreSQL tools and Redis on PATH; disposable data is removed on exit. Linux container execution and cloud delivery remain separate evidence gates.

Next applications run their generated standalone servers with copied static assets; public origins and the health proxy resolve runtime configuration. Shared packages compile before apps; rebuilding those packages is required after shared source changes. The API remains the sole backend authority; the presentation apps proxy only health and do not forward identity or mutation traffic.

## Verification

See [Phase 1 report](../phases/PHASE_01_REPORT.md) for commands and measured results, [local development](../LOCAL_DEVELOPMENT.md) for reproduction and [test matrix](../phases/PHASE_01_TEST_MATRIX.md) for coverage. Local completion does not assert the full nonproduction deployment gate or launch readiness. Security, identity, tenant isolation and financial capability acceptance remain owned by their later phases.

## Tooling dependency overrides

The install audit found a recursive-graph issue in Prisma config's `deepmerge-ts` and two issues in Prisma CLI's unused MySQL driver. The workspace applies targeted overrides to deepmerge-ts 8.0.0 and mysql2 3.23.1, preserving Prisma 7.10.0. Upstream records: [deepmerge-ts advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [MySQL authentication advisory](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr), [MySQL decompression advisory](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3). The production audit then reported no known vulnerabilities. Prisma generation, repeated clean migrations and the complete local suite validate the used PostgreSQL path with these overrides; no MySQL integration is enabled or claimed tested. Reassess/remove overrides when Prisma incorporates the fixes.
