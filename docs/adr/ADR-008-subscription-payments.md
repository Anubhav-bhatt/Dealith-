# ADR-008: Separate subscription billing from acquisition settlement

Status: Recorded baseline, 2026-09-07; subscription payment provider unselected. Sources: master §§36, 42, 85, 93. Implementation begins PHASE-14.

## Context and decision

Billing owns plans, subscriptions, entitlements and invoices behind a provider-neutral adapter. Use provider-hosted collection of sensitive payment credentials and signed authenticated event handling with durable deduplication and reconciliation. The database records subscription state and effective entitlements; redirects and client plan fields are not payment proof. Grace periods, cancellation, proration and failed renewal behavior are explicit policy/versioned requirements before implementation.

Subscription accounts and operations are separate from acquisition escrow. A paid tier can enable a product quota/capability only after existing tenant, NDA, eligibility and authorization predicates pass. Paying for a plan cannot buy a verified badge, remove a compliance hold or release customer funds. Provider choice requires sandbox proof, country/currency/tax/invoice review and access controls; no vendor contract or availability is assumed in Phase 0. See [domain map](../PRODUCT_DOMAIN_MAP.md) and [compliance boundaries](../COMPLIANCE_BOUNDARIES.md).

## Alternatives and consequences

Reusing an acquisition settlement as a subscription ledger confuses customer funds with platform revenue and provider semantics. Implementing raw card processing increases exposure without a product need. Provider-hosted billing reduces credential handling but leaves Dealith accountable for correct local entitlements, renewal/recovery UX and event reconciliation.

## Verification and revisit

PHASE-14 requires sandbox checkout/renewal/cancellation, duplicate/out-of-order callbacks, payment failure, invoice access and immediate entitlement recalculation tests. Downgrades do not destroy held legal evidence or grant confidential access. Live billing waits for PHASE-15 operational and relevant commercial/legal gates. Revisit vendor selection through a capability decision with migration and subscription continuity evidence.
