# Phase 1 continuation file manifest

Date: 2026-09-13. Compared against the recorded 182-file pre-continuation SHA-256 inventory. This distinguishes newly created files from modifications to the existing uncommitted foundation; Git cannot provide a committed baseline. Generated dependencies, clients, build/test output and caches are excluded. All paths are relative to the repository root.

**30 created; 58 modified; 0 removed.**

## Files Created

- `apps/admin/app/error.tsx`
- `apps/admin/app/foundation-status.tsx`
- `apps/admin/app/global-error.tsx`
- `apps/admin/app/globals.css`
- `apps/admin/app/loading.tsx`
- `apps/admin/lib/api-client.ts`
- `apps/admin/postcss.config.mjs`
- `apps/admin/proxy.ts`
- `apps/web/app/error.tsx`
- `apps/web/app/foundation-status.tsx`
- `apps/web/app/global-error.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/loading.tsx`
- `apps/web/lib/api-client.ts`
- `apps/web/postcss.config.mjs`
- `apps/web/proxy.ts`
- `docs/DEPENDENCY_POLICY.md`
- `docs/adr/ADR-018-runtime-certification.md`
- `docs/phases/PHASE_01_FILE_MANIFEST.md`
- `docs/phases/PHASE_01_LOCAL_BASELINE_REPORT.md`
- `packages/config/src/runtime.ts`
- `tests/integration/api.test.ts`
- `tests/unit/errors.test.ts`
- `tests/unit/telemetry.test.ts`
- `tools/benchmark.mjs`
- `tools/browser-server.mjs`
- `tools/clean-install.mjs`
- `tools/infra.mjs`
- `tools/runtime-harness.mjs`
- `tools/secret-scan.mjs`

## Files Modified

- `.env.example`
- `.github/workflows/ci.yml`
- `CHANGELOG.md`
- `Dockerfile`
- `README.md`
- `apps/admin/app/api/v1/health/[kind]/route.ts`
- `apps/admin/app/layout.tsx`
- `apps/admin/app/page.tsx`
- `apps/admin/next.config.mjs`
- `apps/admin/package.json`
- `apps/api/src/main.ts`
- `apps/web/app/api/v1/health/[kind]/route.ts`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/next.config.mjs`
- `apps/web/package.json`
- `apps/worker/src/main.ts`
- `compose.yaml`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/adr/README.md`
- `docs/contracts/platform.openapi.json`
- `docs/phases/PHASE_01_PLAN.md`
- `docs/phases/PHASE_01_REPORT.md`
- `docs/phases/PHASE_01_REQUIREMENTS.md`
- `docs/phases/PHASE_01_TEST_MATRIX.md`
- `package.json`
- `packages/backend/src/api.ts`
- `packages/backend/src/health.ts`
- `packages/backend/src/index.ts`
- `packages/backend/src/outbox.ts`
- `packages/backend/src/redis.ts`
- `packages/backend/src/worker.ts`
- `packages/config/package.json`
- `packages/config/src/server.ts`
- `packages/contracts/src/index.ts`
- `packages/events/src/index.ts`
- `packages/observability/package.json`
- `packages/observability/src/server.ts`
- `packages/security/src/public.ts`
- `packages/security/src/server.ts`
- `packages/types/src/index.ts`
- `packages/ui/src/index.tsx`
- `packages/ui/src/styles.css`
- `packages/ui/src/tokens.css`
- `packages/validation/src/index.ts`
- `playwright.config.ts`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tests/contract/health.test.ts`
- `tests/e2e/foundation.spec.ts`
- `tests/unit/config.test.ts`
- `tools/dev.mjs`
- `tools/local.mjs`
- `tools/smoke.mjs`
- `tools/start-dev-next.mjs`
- `tools/start-next.mjs`
- `tools/test-environment.mjs`
- `tools/test_validate_phase0.py`

## Files Removed

None.

## Preserved foundations

Master scope, all Phase 0 state/domain/security specifications, Prisma schema and the existing migration remain byte-identical to the recorded baseline. No package directory was added or removed. The [Phase 1 report](PHASE_01_REPORT.md) records runtime evidence and remaining gates.
