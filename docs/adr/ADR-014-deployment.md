# ADR-014: Evidence-gated deployment and recovery

Status: Recorded baseline, 2026-09-07. Sources: master §§63–74, 87–91, 93. PHASE-01 pipeline; PHASE-15 production readiness.

## Context and decision

Use GitHub Actions with least-privilege jobs, pinned actions and scoped OIDC deployment identity. Build immutable artifacts once and promote verified digests through isolated environments. PR checks cover formatting, lint/types, relevant tests, security scans, dependency boundaries and contract drift. Trusted preview/staging validation precedes protected production review. Untrusted fork code receives no deployment secrets or privileged execution.

Schema changes use reviewed expand/contract migrations and compatibility evidence. Rollouts have readiness/SLO/invariant halt criteria and a concrete rollback/runbook. External provider actions cannot be reversed by application rollback; unknown operations stay held and reconcile. A restored database does not justify reopening financial writes until provider/audit/evidence and revocation continuity are verified. See [CI/CD](../CI_CD.md) and [deployment](../DEPLOYMENT_ARCHITECTURE.md).

## Alternatives and consequences

Direct workstation production deploys lack reliable artifact/review evidence. Automatic promotion based only on unit tests omits legal/provider/recovery gates. Protected review and representative tests add lead time but are required for consequential workflows. Phase 0 document validation is intentionally separate from runtime/security performance evidence.

## Verification and revisit

PHASE-01 proves real CI, nonproduction smoke and a rollback rehearsal; no success-only stub scripts qualify. Feature phases extend meaningful negative/integration/E2E evidence. PHASE-15 requires independent penetration test before real money, load/recovery/UAT, alert/runbook exercise and recorded authorized release review. Change release mechanics through an ADR preserving auditability and recovery guarantees.
