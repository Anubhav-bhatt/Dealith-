# Definition of Done

Status: Phase 0 baseline, 2026-09-07. Authority: master §§3.9, 63–70 and 89–91. [Phase acceptance](PHASE_ACCEPTANCE_MATRIX.md) supplies phase-specific exits. No feature is implemented by writing this document.

A feature is DONE only when the requirement and applicable API/schema/validation/authorization behavior are implemented, all required UI states work, mobile/accessibility pass, meaningful unit/integration/contract/E2E/negative cases pass, security review is recorded, telemetry and safe analytics are present, documentation is current, CI passes and acceptance evidence is linked. Every omitted check requires an explicit applicability reason; absence of tooling is unfinished work, not a passing result.

| Gate | Evidence required |
|---|---|
| Scope and contracts | Master section/requirement/scenario IDs, owned module, versioned API/events, migration and backward-compatibility plan where affected |
| Correctness | Server authority, exact monetary precision, state/policy coverage, idempotency/concurrency, immutable evidence and transactional audit/outbox |
| Security/privacy | Negative actor/tenant/grant tests, safe DTO/cache/log checks, relevant threat mitigations, dependency and secret review |
| UX/accessibility | Happy/loading/initial-empty/filtered-empty/error/denied/expired/offline states, responsive keyboard/screen-reader and complete-process checks |
| Reliability/operations | Safe errors/traces, bounded retries, unknown-provider reconciliation, runbook and recovery/rollback evidence where affected |
| Verification | Actual commands, environment, synthetic dataset/seed, artifact/commit when available, outcomes and linked sanitized evidence; no always-green stubs |
| Review and delivery | Relevant owner review, CI/build results, change impact, no unresolved critical TODO/FIXME or hidden carryover |

Phase 0 is DONE for documentation only when the architecture set, traceability, catalogs, ADRs, risk/acceptance model and executable document validation are complete and semantic inconsistencies are resolved or identified as blockers. Runtime/deployment/provider tests are inapplicable to Phase 0 and cannot be reported as passed.

Each phase maintains PLAN, REQUIREMENTS, TEST_MATRIX and REPORT. PASS means all applicable blocking gates have evidence. CONDITIONAL PASS is limited to explicitly non-blocking items with actual authorized acceptance, owner, expiry and target. FAIL/BLOCKED names missing gate, owner and next action. No critical security, authorization, financial or audit defect can be hidden as a routine deferral. Design targets and qualified legal/provider approvals remain distinct from engineering test outcomes.
