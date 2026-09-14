# Dealith

Discover. Verify. Negotiate. Acquire.

Dealith is a planned marketplace and transaction workspace for technology assets and digital businesses. The repository now includes the **local platform foundation**: web and admin shells, an API, a background worker, PostgreSQL migrations and a durable outbox. Product registration, listings, transactions and provider integrations remain unavailable.

With Node 24.19+, pnpm 11.24.0, PostgreSQL 15 command-line tools and Redis on your PATH:

```sh
pnpm install --frozen-lockfile
pnpm dev:local
```

This generates the database client, builds shared packages, migrates an isolated temporary database and starts all four apps. Open `http://localhost:3000` for web and `http://localhost:3001` for admin. Stop with Ctrl-C; this disposable session removes its data. No `.env` or provider credentials are required. Ports 3000, 3001, 4000 and 4001 must be free.

See [local development](docs/LOCAL_DEVELOPMENT.md) for prerequisites, persistent optional containers, verification and recovery. Actual results and remaining delivery gates are in the [Phase 1 report](docs/phases/PHASE_01_REPORT.md). The [Phase 0 report](docs/phases/PHASE_00_REPORT.md) preserves the earlier document-only evidence. The original [master scope](DEALITH_MASTER_PROJECT_SCOPE.md) remains unchanged; [ADRs](docs/adr/README.md) record decisions and amendments.

## Verify the architecture package

Python 3.9+ and its standard library are sufficient; no dependency install or network is required:

```sh
python3 tools/validate_phase0.py
python3 -m unittest discover -s tools -p 'test_validate_phase0.py'
```

The checker verifies the documented file set, local Markdown links/anchors, source checksum, master traceability, catalog coverage, lifecycle registry/table/adjacency parity, event references, API roots, ADR IDs and scenario/phase mappings. Its success establishes those document properties; it does not certify security, legal suitability, provider behavior or runtime tests.

## Canonical document map

Master §92 names logical documents. This table maps each to one canonical file so duplicate masters and conflicting copies are not introduced. Other focused documents are linked from the architecture and relevant specifications.

| Master logical document      | Canonical file                                                     |
| ---------------------------- | ------------------------------------------------------------------ |
| `README.md`                  | [README.md](README.md)                                             |
| `MASTER_PROJECT_SCOPE.md`    | [DEALITH_MASTER_PROJECT_SCOPE.md](DEALITH_MASTER_PROJECT_SCOPE.md) |
| `MASTER_PRODUCT_SPEC.md`     | [docs/MASTER_PRODUCT_SPEC.md](docs/MASTER_PRODUCT_SPEC.md)         |
| `ARCHITECTURE.md`            | [docs/MASTER_ARCHITECTURE.md](docs/MASTER_ARCHITECTURE.md)         |
| `ARCHITECTURE_DECISIONS.md`  | [docs/adr/README.md](docs/adr/README.md)                           |
| `DATA_MODEL.md`              | [docs/DATA_MODEL.md](docs/DATA_MODEL.md)                           |
| `API_CONTRACTS.md`           | [docs/API_BOUNDARIES.md](docs/API_BOUNDARIES.md)                   |
| `SECURITY_MODEL.md`          | [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md)                   |
| `THREAT_MODEL.md`            | [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md)                       |
| `RBAC_ABAC_MATRIX.md`        | [docs/RBAC_ABAC_MATRIX.md](docs/RBAC_ABAC_MATRIX.md)               |
| `COMPLIANCE_BOUNDARIES.md`   | [docs/COMPLIANCE_BOUNDARIES.md](docs/COMPLIANCE_BOUNDARIES.md)     |
| `TEST_STRATEGY.md`           | [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md)                     |
| `E2E_TEST_MATRIX.md`         | [docs/E2E_TEST_MATRIX.md](docs/E2E_TEST_MATRIX.md)                 |
| `DEPLOYMENT.md`              | [docs/DEPLOYMENT_ARCHITECTURE.md](docs/DEPLOYMENT_ARCHITECTURE.md) |
| `OBSERVABILITY.md`           | [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)                     |
| `RUNBOOKS.md`                | [docs/RUNBOOKS.md](docs/RUNBOOKS.md)                               |
| `PROJECT_RISK_REGISTER.md`   | [docs/PROJECT_RISK_REGISTER.md](docs/PROJECT_RISK_REGISTER.md)     |
| `PHASE_ACCEPTANCE_MATRIX.md` | [docs/PHASE_ACCEPTANCE_MATRIX.md](docs/PHASE_ACCEPTANCE_MATRIX.md) |
| `CHANGELOG.md`               | [CHANGELOG.md](CHANGELOG.md)                                       |

## Implementation boundaries

Four composition roots live under `apps/{web,admin,api,worker}`; `packages/backend` owns server persistence and delivery. Twelve shared packages have checked import boundaries. Implemented API contracts are /api/v1/health, /api/v1/readiness and /api/v1/version, with legacy probe aliases. Web/admin pages certify actual API/database/Redis/worker readiness and have no marketplace functions. The admin shell contains no privileged data or enabled authentication substitute.

All providers, launch jurisdictions, production credentials and real-money activation remain governed by the [compliance boundaries](docs/COMPLIANCE_BOUNDARIES.md) and phase evidence. The working brand has not received formal name clearance.

## Everyday commands

Use `pnpm dev:local` for a complete disposable native setup, or copy `.env.example` to `.env`, run `pnpm infra:up`, `docker compose run --rm migrate`, `pnpm db:generate`, `pnpm build:packages`, then `pnpm dev` for persistent Docker dependencies with native applications. All four app ports are explicit. `pnpm build` builds each app independently; `pnpm --filter @dealith/web build` and equivalent scoped commands work after shared packages are built.

Run `pnpm verify` for the non-destructive local quality gate (temporary test resources only). Individual commands include format:check, lint, typecheck, test:unit, test:component, test:api, test:integration, test:e2e and test:smoke. Fresh install and loopback performance evidence use test:clean-install and test:benchmark. The [local guide](docs/LOCAL_DEVELOPMENT.md) includes environment, migrations, observability, security differences and troubleshooting. [Dependency policy](docs/DEPENDENCY_POLICY.md) records additions and advisory overrides.

Repository layout: `apps/{web,admin,api,worker}` are composition roots; shared `packages/` enforce browser/server boundaries; `prisma/` contains infrastructure schema/migrations; root Dockerfile and compose.yaml describe runtime containers/local dependencies; `infra/local/` holds synthetic runtime-role setup; `tools/` owns repeatable verification/startup; `docs/` contains architecture and phase evidence. Cloud provisioning remains out of scope. The full Phase 1 verdict remains constrained by Docker and remote CI evidence, as recorded in the current report.
