# ADR-009: Provider-managed escrow and durable orchestration

Status: Recorded baseline, 2026-09-07; provider and launch jurisdiction unselected. Sources: master §§8, 35–38, 75, 93. Sandbox implementation begins PHASE-11.

## Context and decision

Dealith orchestrates provider-managed fiat escrow for approved commercial transactions. Providers hold/move funds; Dealith stores obligations, approvals, immutable observations, operations and reconciliation evidence. A payment processor is not assumed to offer suitable escrow. One settlement belongs to one deal and signed agreement version; Deal Cart has no checkout/combined custody. The initial executable contract uses positive fiat amounts and fully funded escrow; milestones/other deal structures remain gated by actual supported capability and agreement terms.

Adapters implement participant/eligibility, settlement/escrow creation, funding, release, refund, cancel, status, signed webhook verification and reconciliation methods from [settlement architecture](../SETTLEMENT_ARCHITECTURE.md). Persist intent, stable scoped idempotency key, amount reservation, audit and outbox before external execution. Retry the same logical operation; reconcile unknown outcomes before any new financial action. Provider evidence must match account/environment, parties, currency, exact amount and agreement/destination version. Append corrections/reversals rather than rewriting history.

Release requires confirmed funds, acceptance/inspection, current authority, required independent approvals and no dispute/compliance hold. Callback order, browser return, chat, AI output and local workflow status cannot establish financial truth. Candidate selection must verify the complete contracted escrow and authenticated callback/recovery capability in sandbox. Missing signed delivery needs an approved authenticated relay or a different provider; unsigned callbacks alone do not qualify.

## Alternatives and consequences

Native custody expands financial/regulatory responsibility and is excluded. Direct client payment success and naive webhook mutation risk duplicate or false settlement. An adapter enables replaceable integration seams but no automatic provider failover after an unknown/successful operation. Human reconciliation and provider support remain necessary for ambiguity.

## Verification and revisit

PHASE-11 requires duplicate/altered/out-of-order callback, crash-after-success, expired provider idempotency, exact money, over-release/refund races and unknown-outcome tests. PHASE-12 proves full acquisition/inspection/dispute/recovery. Real-money enablement waits for PHASE-15 independent security assessment, provider capability/contract evidence, jurisdiction/eligibility review, on-call and restore/reconciliation gates. No legal conclusion or procurement approval is recorded here.
