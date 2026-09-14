# CI/CD architecture

Status: frozen target. Repository audit found no existing application CI/CD. Phase 0 supplies documentation and its verification tooling only; the following application commands/jobs are planned, not claimed executable today.

## Phase 0 verification

Run `python3 tools/validate_phase0.py` when the architecture document set is complete. The checker must validate required files, links, inventories, state/event/domain references and scenario IDs as implemented; its successful output proves only those checks. Human cross-document review must separately verify semantic permissions, financial recovery, phase order and scope contradictions. Record actual commands and outcomes in the Phase 0 report. No app build, provider sandbox, deployed preview or production test can be reported as passed before it exists.

## Target pipeline

| Stage | Checks / evidence | Gate / failure behavior |
|---|---|---|
| Pull request classification | Changed domains, requirement IDs, risk, schema/event/API changes, owner review | Required architecture/security owner added for boundary changes; no automatic bypass for generated files |
| Format / lint / types | Workspace formatting, ESLint, strict TypeScript, forbidden imports/cycles, documentation checks | Required checks; frontend cannot import Prisma/domain persistence |
| Unit / component | Vitest/Jest/RTL, critical branches and state/policy cases, accessibility behavior | Required affected suites plus all security/financial invariants for relevant changes |
| Integration | Testcontainers PostgreSQL/Redis, transaction/outbox, object flow and migration behavior | Real DB suite; unique ephemeral resources and deterministic cleanup |
| Contract | OpenAPI validation, web/admin contract checks, event compatibility, adapter fixture checks | Breaking contracts require version/migration plan and consumers passing |
| Security / supply chain | Secrets, dependencies, licenses, SAST, container/IaC scans; SBOM/provenance | Critical unresolved security findings block; lower-risk exceptions require owner, expiry and documented reason |
| Migration validation | Apply from previous supported schema and empty baseline; compatibility and lock review | No destructive migration without approved rollout/backup/recovery plan; no migration when none changed |
| Build | Reproducible lockfile install and build of changed deployables; image digest/signature | Build once; immutable artifact promoted through environments |
| Preview deployment | Trusted PR only, isolated ephemeral environment and synthetic fixtures | OIDC deploy role limited to preview; no production secrets or provider live access |
| E2E | Playwright/API E2E relevant journeys and tenant denial tests; mobile/accessibility smoke | Required scenarios green; failed critical tests cannot be hidden by retries |
| Review / merge | Code owners, risk/DoD evidence, required checks, dependency/boundary review | Protected main branch; no self-approved high-risk financial/security change |
| Staging | Identical reviewed artifact, expand migration, deployment + smoke | Smoke failure stops promotion; provider sandbox and feature-phase acceptance |
| Pre-production | Full critical E2E, provider sandbox, k6, resilience/restore, authenticated security tests, UAT | Production-candidate release evidence; Phase 15 requires independent pentest before real money |
| Production approval / rollout | Protected environment reviewers, artifact digest, migration/rollback plan, launch flags and operational readiness | Temporary least-privilege role; canary/rolling rollout; no auto-approval from passing tests |
| Post-deploy | Read-only health/public and synthetic session smoke, SLO/invariant monitoring | Halt rollout or compatible rollback on failure; reconcile financial uncertainty before writes |

The flow follows PR → checks → preview/E2E → review → merge → staging → pre-production gates → production → post-deploy smoke. Formatting/lint/type/unit/component/security jobs can run independently where inputs permit; integration requires built contracts/test services, deployment requires successful build/security gates, and approval/migration/promotion remain sequential. Cache keys include lockfile, runtime, OS and dependency inputs; caches contain no secrets, sessions, provider fixtures with PII or private documents.

## Workflow trust and permissions

GitHub Actions jobs use minimum `permissions`, commit-SHA-pinned third-party actions, protected environment rules and OIDC trust constrained by repository/ref/environment. Do not execute untrusted PR code in a privileged `pull_request_target` job. Fork PRs receive secret-free static/test jobs; privileged preview deployment waits for trusted review and an explicit controlled workflow. Production deploy and Terraform apply identities cannot read arbitrary secrets or administer accounts. Terraform plan/apply uses separate reviewable artifacts, encrypted remote state, locking and environment-specific credentials.

Secrets come from environment-scoped managed stores; never echo them, embed them in generated reports, pass them through frontend build variables or retain them in Actions caches. Test diagnostics strip cookies, document contents and signed links. Workflow artifacts follow the restricted retention in [test strategy](TEST_STRATEGY.md). Deployments record who approved, commit, digest, schema version, environment, timing and flag changes in a durable change record.

## Planned workspace verification contract

Phase 1 establishes `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:component`, `pnpm test:integration`, `pnpm test:contract`, `pnpm test:e2e` and `pnpm build`, plus migration/security/performance tasks with documented environment prerequisites. These are target script names, not commands executed in Phase 0. Avoid stub scripts that always succeed. Required checks become branch protections only when implemented and meaningful; each phase extends coverage before accepting its feature.

Documentation-only changes run the architecture checker and affected links/content validation, not fabricated application tests. Changes to security, state-machine or contract specifications also require semantic owner review and update the corresponding acceptance scenarios. Dependency updates run the affected suites and vulnerability checks.

## Exceptions and emergency changes

An emergency production change requires a named incident, accountable approver, narrow scope, recorded waived gates, compensating checks and follow-up deadline. It does not permit custody, unsigned financial callbacks, unaudited privileged changes or removal of tenant isolation. The emergency workflow preserves immutable artifacts, deploy audit and post-deploy smoke. If automatic tooling or protected environments reject a deployment, stop that mutation and record the actual rejection; do not silently choose another identity or path.

## Rollback and release evidence

Use rolling/canary deployment with readiness and automatic halt thresholds from [observability](OBSERVABILITY.md). Revert compatible application artifacts where safe; expand/contract schema and event compatibility are prerequisites. External provider actions are reconciled, not undone by redeploying code. The release manifest links tests, security review, phase gate, provider sandbox evidence, recovery plan, migrations, artifacts and approval. Phase 0 has no such release manifest because no application release exists.

## Phase 1 local implementation

The implemented workflow is [ci.yml](../.github/workflows/ci.yml). It pins action commits, grants read-only repository permissions, installs the frozen lockfile and runs `pnpm check:ci` against dedicated PostgreSQL/Redis services. The shared test chain includes `pnpm test:tooling` for development-supervisor failure and descendant shutdown behavior. Each integration run creates and removes only its uniquely named database and runtime role and uses a unique Redis prefix. Browser traces upload on failure with seven-day retention. No deploy, cloud credentials or external communications are configured.

`pnpm check` includes the additional native four-process outage/restart/backup smoke test. `check:ci` omits this native-only destructive-service harness and uses the dedicated CI integration services. Local execution is recorded in the [Phase 1 report](phases/PHASE_01_REPORT.md); the workflow has not been run on GitHub and branch protection is not configured. Container build execution, Linux parity, SAST/secret-scanner tooling, full SBOM/signing, performance/security gates and nonproduction deployment remain delivery follow-up work; no success stub stands in for them.
