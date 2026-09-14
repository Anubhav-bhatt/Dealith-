# Phase 01 plan

Status: Runtime certification work, 2026-09-11. Governing input: the expanded Phase 1 Platform Foundation, Engineering Baseline & Runtime Certification request (sections 1–76). The earlier local-only result is preserved in [historical report](PHASE_01_LOCAL_BASELINE_REPORT.md); it cannot substitute for the current acceptance checklist. The user explicitly instructed: do not push to Git or find a repository; the target will be provided later.

## Repository before continuation

Phase 0 required artifacts were present and `python3 tools/validate_phase0.py` passed: 51 domains, 138 conceptual entities including the implemented operational projection, 17/28 project/deal states and 17 ADRs. No P0 architecture gap prevented foundation work. Master checksum remains unchanged. Existing four-app pnpm workspace, twelve shared packages, pinned dependencies, native Postgres/Redis harness, four-table migration, durable outbox/receipt, development supervisor, baseline tests, standalone Next builds, optional single-stage Docker and authored CI were preserved. Git was initialized on main with no commits or remote; every project file was untracked. Existing runtime pins are supported, compatible installed versions; no framework migration is needed.

Gaps against the expanded request: canonical health/version endpoints, explicit CORS, safe full error categories, application trace correlation/metrics export, Tailwind/CSP, meaningful certification screens, no-skip browser accessibility and actual API integration, production runtime packaging, complete convenience scripts, fresh-install and benchmark evidence. Runtime features such as identity, projects, payments and AI remain excluded.

## Execution and gates

1. Read governing architecture and preserve state/domain/security boundaries; record factual refinements in ADR-018.
2. Complete API composition/configuration/contracts, observable Redis/outbox and explicit inactive auth/business-audit seams. Keep existing infrastructure tables and migrations.
3. Replace marketing scaffold with accessible development certification pages; share tokens/primitives; add loading/error/empty and request-failure handling, nonce CSP and typed health transport.
4. Complete developer commands, isolated test/benchmark/fresh-install harnesses, production container targets and secret-free CI. Keep PostgreSQL/Redis provider-independent native fallback as ADR-017 permits.
5. Run actual static, unit/component, contract/API E2E, real infrastructure, browser/axe, recovery, clean-install, benchmark and audit checks. Resolve failures; record exact results. Docker and remote CI remain NOT RUN unless actual execution evidence becomes available.

No production provisioning, GitHub discovery, push or domain implementation is authorized in this continuation. A successful local suite does not change the full Phase 1 verdict to PASS while a mandatory gate is unrun.

## Phase 1C authorization and available gates

The later Phase 1C request authorizes repository safety fixes, staging and the initial local commit; a normal push is authorized only when an approved repository URL is available. This supersedes the earlier prohibition on Git changes within that scope. No URL is available and repository discovery remains prohibited. Docker availability was checked again and the executable is absent. Complete local safety/regression checks and Git bootstrap when author identity is provided; retain both Docker and remote CI gates as unrun. No Phase 2 functionality is authorized.
