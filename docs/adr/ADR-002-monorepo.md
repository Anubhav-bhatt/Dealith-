# ADR-002: Monorepo and dependency boundaries

Status: Recorded baseline, 2026-09-07; explicit amendment of master §50 layout. Sources: master §§48–50, 93. Implementation begins PHASE-01.

## Context and decision

The repository contained only the master document at the inventory audit. Use pnpm workspaces, one lockfile and strict TypeScript. The canonical applications are `apps/web`, `apps/admin`, `apps/api` and `apps/worker`. **`packages/backend` is the canonical home of backend domain, application and infrastructure modules.** `apps/api` owns HTTP composition; `apps/worker` owns worker startup. Neither application imports the other's internal source. The illustrative `apps/api/src/modules` sentence in the architecture is superseded by this location before scaffolding.

Shared packages are `ui`, `contracts`, `validation`, `types`, `events`, `config`, `security`, `observability`, `eslint-config`, `tsconfig` and `test-kit`; root `prisma` owns schema/migration artifacts; `infra/{terraform,docker,monitoring}` owns deployment definitions. The `apps/` layout replaces master `frontend/` and `backend/` directories without removing their responsibilities. The backend package is server-only and excluded from browser dependency graphs.

Web/admin use Next.js App Router, shared accessible UI tokens and components, TanStack Query for remote state, React Hook Form/Zod for forms and URL state for public filters. Next.js rendering, route handlers and server actions use NestJS contracts; they cannot query the database or establish alternate domain authority. `contracts`, `validation`, `types` and `events` contain browser-safe schemas/values, never Prisma models or provider SDKs. Public/server exports of config, security and telemetry are explicit. `test-kit` cannot enter production imports. UI does not import backend/persistence/provider packages.

## Alternatives and consequences

Keeping the master's two parallel frontend/backend package trees would duplicate tooling and weaken one-way package imports. Putting all backend logic inside the API app would force workers to import app internals or duplicate rules. A shared server package allows two composition roots at the cost of enforcing exported entry points. Universal catch-all packages are rejected because they can leak server secrets and entangle modules.

## Verification and revisit

PHASE-01 pins supported compatible versions, bootstraps actual scripts, and proves import graph, browser bundle exclusion, independent API/worker startup, shared contract generation and lockfile reproducibility. No package scaffold, installed version or successful build is claimed in Phase 0. Later moves require an ADR plus import/migration plan. See [inventory](../REPOSITORY_INVENTORY.md).
