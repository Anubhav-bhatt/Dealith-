# Settlement architecture

Status: Phase 0 architecture freeze. Source: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md), sections 8–9, 33, 35–38, 73, 75–76. Provider selection, launch jurisdictions and contractual terms are later capability gates; no provider account, payment code, custody or production resource is created here. Related: [deal lifecycle](DEAL_STATE_MACHINE.md), [authorization](RBAC_ABAC_MATRIX.md), [crypto](CRYPTO_BOUNDARY.md), [events](DOMAIN_EVENTS.md).

## Frozen boundary

Settlement is a NestJS module that orchestrates approved external providers. The provider holds customer funds, supplies onboarding/funding instructions, performs supported financial execution and reports transaction evidence. Dealith owns commercial instructions, authorized requests, local status projections, durable financial-operation history, reconciliation, risk holds and audit. Dealith never maintains spendable customer balances or treats its internal journal as a custodial ledger.

One settlement belongs to one deal and one executed agreement version, not to a Deal Cart. A deal may have historical failed/replaced settlement attempts, but only one active settlement per agreed settlement obligation; replacement must prove the prior attempt has no unknown, held or outstanding money. V1 supports provider-managed fiat escrow with explicitly contracted funding, inspection, release, cancellation, dispute and refund semantics. Partial/milestone disbursements require a provider capability and agreement-defined schedule; unsupported capabilities return `UNSUPPORTED_CAPABILITY`, never simulated success.

Subscription billing is a separate module/provider account and does not settle acquisitions. A payment processor is not assumed to be a legally or operationally suitable escrow provider. Public provider documentation is evidence for behavior to test, not procurement approval.

## Provider-neutral interface

Every adapter implements the following logical port; concrete SDK types cannot escape it. `OperationContext` carries provider/account/environment, stable operation ID and idempotency key, correlation/causation/trace IDs, agreement version, actor/approval references and request digest. Commands return `ProviderOperationResult` with `accepted|pending|confirmed|rejected|unknown`, provider object references, normalized evidence and safe failure code. Accepted means submitted, not financially final.

| Method | Input/output responsibility | Authorization/invariant |
|---|---|---|
| `createParticipant()` | Create/reuse provider participant for user/legal organization; return provider reference or hosted onboarding link | Verified representation and consent; do not copy raw KYC unless required by approved design |
| `verifyParticipant()` | Request/poll provider eligibility and requirements; return dated evidence | Provider screening is one input; Dealith deterministic jurisdiction/risk gate also applies |
| `createSettlement()` | Register exact agreement obligation, parties, amount/currency and allowed rail | All required signatures and participants valid; immutable agreement hash |
| `createEscrow()` | Create provider-managed escrow for the settlement | Capability/terms match, no other live attempt, operation durably reserved |
| `fund()` | Return or initiate supported provider-hosted funding instruction/action | Payer authorization, limits and supported rail; no raw card/bank credential handling by browser/API |
| `release()` | Submit authorized milestone/final release instruction | Confirmed eligible funds, completed acceptance/inspection, current beneficiary, approvals, no hold |
| `refund()` | Submit supported refund instruction against original confirmed funding/available balance | Agreement/dispute resolution permits; amount not already released/refunded/reserved |
| `cancel()` | Cancel an unfunded obligation or provider-approved fully resolved escrow | No funds/unknown operation/outstanding liabilities stranded; funded money must be resolved first |
| `getStatus()` | Fetch authoritative provider state, balances, activity and timestamps | Account/object/environment match; adapter maps evidence without overwriting journal |
| `handleWebhook()` | Verify raw signed callback and normalize authenticated event envelope | Authenticate before trust; this method cannot directly mutate Deal or release money |
| `reconcile()` | Compare provider objects/activity with local operations and journal | Record discrepancies and suggested actions; monetary actions still use normal authorized commands |

Adapters also publish capabilities: countries/legal entity types, currencies, amount limits, true escrow support, refund/cancel/dispute semantics, milestones, idempotency retention, signature/replay scheme, status lookup, listing type eligibility and operational SLAs. Capability snapshots are versioned with each settlement. Failover between providers is not a retry strategy after any operation may have succeeded.

## Conceptual records and money invariants

| Record | Ownership and required invariant |
|---|---|
| SettlementParticipant | Settlement-owned reference to user/organization, provider account, environment and verification evidence; no cross-environment reuse |
| Settlement | Deal/agreement version, payer/payee, rail, currency, exact amount, capability snapshot and projection state/version |
| Escrow | Settlement and unique provider escrow reference, funding/release/refund projections; provider owns custody |
| SettlementMilestone | Agreed amount, release conditions, inspection window and signed approval requirements; totals conserved |
| SettlementDestination | Versioned provider-owned beneficiary reference and verification state; immutable binding per approved operation |
| SettlementApproval | Actor, role/side, exact operation/destination/agreement hash, timestamp, step-up evidence and validity |
| ProviderOperation | Durable command, provider/account/environment, idempotency key, request digest, attempt history and outcome; unique command identity |
| FinancialTransaction | Append-only provider activity reference, kind, decimal amount/currency, effective time, parent/reversal references; observations never overwritten |
| ProviderEvent | Durable signed webhook inbox, provider event ID/account/env, digest, received time, processing status and limited encrypted payload reference |
| ReconciliationRun / ReconciliationDiscrepancy | Query bounds, provider watermark/evidence, differences, assigned case and audited resolution |

Use PostgreSQL exact numeric/Prisma Decimal plus ISO currency and declared currency precision; do not use floating point. Provider minor-unit conversions are exact, reject overprecision and unsafe ranges, and are tested by currency. No implicit FX: currency conversion requires an explicit quoted rate, fee, expiry, rounding rule and agreement consent in a later capability.

For each settled obligation, recorded confirmed funding equals confirmed disbursements + confirmed refunds + provider-reported remaining held funds + explicit agreed provider fees, allowing separately recorded chargebacks/reversals. Reserve pending release/refund amounts under a settlement lock so concurrent requests cannot overallocate. Unknown amounts and mismatched fee/currency evidence trigger a hold, not an arithmetic patch. Unique provider transaction references and unique logical obligation/operation identities enforce zero duplicate recognized effects.

## Durable operation protocol

1. Resolve server-side actor, participant/signatory authority, current agreement, destination, jurisdiction, risk status and phase. Step-up and dual authorization apply per policy. Validate exact Decimal amounts and client `Idempotency-Key` scope. The same key with a different request digest is a conflict.
2. In one database transaction lock/version-check settlement and obligation, reserve amount/transition intent, insert `ProviderOperation`, audit and outbox event. Do not hold a database transaction open across a provider network call.
3. A worker claims the operation with a lease and calls the adapter using the stored key. Keys are stable for the **logical operation**, scoped by provider/account/environment; retry attempts never generate a new key. The key and request body remain identical even after process restarts.
4. Record response/evidence in a new transaction. Immediate provider acceptance remains pending until the adapter's authoritative confirmation rule is satisfied. A crash after provider success but before local commit leaves an unknown operation to reconcile, not permission to submit a fresh payment.
5. Retry safe transport failures with bounded exponential backoff and jitter using the same key, honoring provider rate limits. When provider idempotency retention has expired or status is ambiguous, first resolve by merchant reference/provider query; if uniqueness cannot be established, require manual provider reconciliation. Do not retry a new money movement optimistically.
6. Business rejection or exhausted safe retries creates an assigned review/discrepancy with alerts. Transient provider failure preserves workflow pending/hold; `FAILED` is reserved for the canonical terminal condition with no stranded financial obligations. All resolutions preserve prior attempts and evidence.

Exactly-once external delivery is not claimed. Durable local uniqueness + stable provider idempotency + reconciliation target one recognized financial effect despite at-least-once delivery. A provider unable to satisfy this evidence/control contract cannot be enabled for that operation.

## Signed webhook inbox and reconciliation

Dedicated `/api/v1/settlements/webhooks/{provider}` ingress receives raw bytes with a strict size limit. Verify the provider signature using the raw payload, key identifier and current/rotation secret, timestamp/replay window and expected account/environment before parsing as trusted data. IP restrictions may supplement signatures; they never replace them. Verify object references, merchant reference and expected currency/amount against local records. Unknown signed objects go to a quarantined inbox/manual case without creating an authorized deal.

Insert `ProviderEvent` with a unique `(provider, account, environment, providerEventId)` key and audit receipt durably before returning success. Return a retryable failure when durable storage is unavailable. A verified exact duplicate returns success without repeating effects; the same event ID with a different digest triggers a security alert. Retain only required payload fields, with restricted encrypted raw evidence for a policy-defined period. Workers consume the durable inbox; BullMQ is a scheduling accelerator, not the receipt source of truth.

Delivery order is not authority. Compare event version/sequence if the provider guarantees one, then fetch current provider state/activity when events are old, missing, contradictory or monetary. Never move a local projection backwards using a late status label or discard a valid reversal as merely old. Reversals/chargebacks are new facts with references to the earlier transaction. A provider-confirmed result is passed to the Settlement application service; it emits a domain event consumed by the Deal engine, which checks its own transition guards.

Stripe documents duplicate and unordered webhook deliveries; this informs the adapter contract without selecting Stripe for escrow. [Stripe webhook behavior](https://docs.stripe.com/webhooks) Escrow.com recommends retrieving the related transaction to verify webhook information; its public webhook page alone does not establish the signed-callback guarantee required here. Candidate adapters must demonstrate authenticated signed delivery or an approved provider-authenticated relay before enablement; unsigned callbacks alone are insufficient. [Escrow.com webhooks](https://www.escrow.com/api/docs/webhooks)

Initial design reconciliation: poll active/unknown operations every five minutes within provider limits, run a daily full financial reconciliation over the provider-supported activity window, and reconcile immediately before any release. Watermarks overlap previous intervals to catch delayed events and deduplicate by provider transaction ID. Daily totals and object-level differences are both required. Escalate unknown monetary operations older than 15 minutes; exact timings may tighten through provider capability review without weakening correctness.

## Deal progression, disputes and cancellation

The canonical [Deal state machine](DEAL_STATE_MACHINE.md) is the only authority for deal statuses. `SETTLEMENT_PENDING` follows confirmed agreement signing. Escrow creation/funding intent supports `ESCROW_PENDING`; only authoritative matched funding supports `ESCROW_FUNDED`. Transfer/inspection evidence supports `ASSET_TRANSFER` and `INSPECTION`. An approved instruction supports `RELEASE_PENDING`; confirmed complete provider disbursement and reconciled amounts support `SETTLED`. `CLOSED` additionally requires completion/portfolio/audit conditions.

Local `Settlement` and `ProviderOperation` states are separate projections, never new Deal state strings. A return URL, browser screenshot, buyer declaration, chat message or AI analysis cannot confirm money. `settlement.released` records confirmed evidence; a worker must not invent a synthetic `escrow.funded` or directly run arbitrary `UPDATE deal SET status`.

A dispute freezes unexecuted release/refund/cancel operations and opens `DealDispute`/assigned case. Already submitted provider actions are queried/cancelled only where supported; a local hold cannot promise reversal of money already sent. Preserve the saved pre-dispute phase and immutable financial history. Resolution must reconcile funds, verify authority and return only to the explicitly allowed saved phase or permitted resolved outcome. A post-`SETTLED`/`CLOSED` dispute does not erase the historical payment or undo the asset transfer automatically.

Cancellation while funded requires confirmed provider refund/other contractual resolution, zero unresolved held funds and handled release liabilities before terminal `CANCELLED`. Terminal `FAILED` also requires no stranded funds/obligations. Risk holds or provider outages keep the workflow pending or disputed with a reason and assigned owner. Manual review records evidence and proposes normal domain commands; staff cannot type a final state or edit a journal balance.

## Destination, approvals and operational controls

Beneficiaries are provider-owned verified references, not free-text bank details accepted at release time. A destination change creates a new version, notifies affected parties through an independent channel, requires fresh step-up and two distinct authorized approvals, and invalidates outstanding release approvals. A frozen release request binds exact destination, amount/currency, agreement version and milestone. No staff member may propose and approve their own operational override; designated customer authority remains required by the agreement.

Apply per-actor/per-deal limits, provider capability checks, deterministic sanctions/risk blocks and role-separated provider credentials. Keep webhook secrets and API credentials in Secrets Manager and use narrow egress allowlists. Production and sandbox accounts, secrets, endpoints and object IDs are isolated. Neither logs nor browser analytics receive funding tokens, KYC evidence or full beneficiary details. Alerts cover signature failures, unknown monetary operations, reconciliation drift, duplicate conflicts, stale inbox, destination changes and release during a hold.

## Phase gates and evidence

Phase 11 builds provider port, contract tests, fake adapter, sandbox agreement/escrow integration, signed inbox, durable operations, journal and reconciliation. Phase 12 verifies transfer/inspection/release/refund and complete sandbox acquisition. Production money remains disabled until phase 15 legal/jurisdiction review, provider contracts/capability evidence, dispute operating model, security review, reconciliation runbooks and independent approval controls pass.

Required tests: repeated client key; altered request same key; concurrent release/refund; duplicate event/different ID for same transaction; event ID digest conflict; wrong signature/account/environment; expired signature; out-of-order and missing callbacks; timeout before/after provider execution; crash after provider success before commit; expired provider dedup window; amount/currency mismatch; destination change while queued; dispute during in-flight release; funded cancellation; partial funding; fees; reversal after settlement; provider outage; restore followed by provider reconciliation. Assert zero duplicate recognized effects, no unauthorized state change and complete durable audit. These are acceptance targets, not measured results.
