# Domain events and transactional delivery

Status: Phase 0 baseline, 2026-09-07. Sources: master §§53–54 and 59; [domain map](PRODUCT_DOMAIN_MAP.md), [data model](DATA_MODEL.md) and [lifecycle registry](architecture/LIFECYCLE_REGISTRY.json). This is a versioned contract design; no broker or consumer is deployed.

## Envelope and authority

Every event carries `eventId`, `eventType`, `schemaVersion`, `occurredAt` (UTC), `producer`, `aggregateType`, `aggregateId`, `aggregateVersion`, `securityScope` (typed principal/deal scope), `actor` (user/service and represented capacity), `correlationId`, `causationId`, `requestId`, `policyVersion` and a validated minimal `payload`. System events have an explicit service identity, not a fabricated user. Public transport never exposes the raw envelope. Event payloads contain references and safe factual metadata, not session tokens, source code, document bytes, KYC or bank credentials.

The owning module emits its fact once. `deal.transitioned` and `project.transitioned` are emitted only by their lifecycle owner. A registry edge's additional events describe its transaction or causal contract: an Access/NDA/Settlement fact can be the already-persisted cause for a later guarded Deal transition. The Deal consumer must not emit a second copy of that fact. When a coordinator composes local services, their domain facts and audit/outbox commit in the same transaction. Events cannot grant permission, satisfy an unverified signature or independently establish provider truth.

## Delivery, ordering and recovery

1. Commit business state, mandatory AuditEvent and OutboxEvent atomically through the owning service and shared transaction context. External calls occur after commit via durable ProviderOperation or job intent.
2. Dispatchers claim PostgreSQL outbox rows with bounded leases and enqueue stable event IDs. Redis/BullMQ schedules delivery; PostgreSQL retains accepted intent and progress. Queue loss is repaired by redispatch of unacknowledged events.
3. Each consumer/version validates schema, scope and prerequisites. It commits its local effect and unique ConsumerReceipt in one transaction. External effects use a separate durable operation and stable provider idempotency key; a consumer receipt alone is not provider confirmation.
4. Retry transient failures with bounded exponential backoff/jitter, provider rate limits and an explicit budget. Exhaustion enters a durable dead-letter/review state with an assigned owner, safe error and alert. Never drop a financial or audit event to drain a queue.
5. Preserve ordering per aggregate using aggregate version/checkpoint checks. Gaps trigger authoritative query/replay; global ordering across aggregates is not assumed. A late callback cannot overwrite newer truth, and a legitimate reversal is a new fact rather than an old status to discard.
6. Replay exact event IDs with consumer-version tracking and authorization rechecks. Schema migration/upcasting must be deterministic and reviewed. Rebuild search/analytics into an isolated projection generation, compare, then cut over; never replay notification or money effects as fresh operations.

Consumers of protected content reauthorize current audience at execution and delivery, including membership, grants, NDA and source policies. A committed revocation wins over stale projections. At-least-once delivery is expected; exactly-once external delivery is not claimed. Outbox age, lease failures, dead letters, gaps, receipts and reconciliation drift are measured under [observability](OBSERVABILITY.md).

## Complete event catalog

Every listed type starts at schema version 1 when implemented. The payload column supplements the common envelope. Consumer names are owning module roles, not a promise of one service each. Notifications and analytics receive minimized projections and only when applicable consent/policy permits. Audit is already atomic with the original command; an event consumer cannot repair a missing mandatory audit commit.

| Event | Producer | Consumers | Payload / effects | Phase |
|---|---|---|---|---|
| `access.approved` | Access | Deals, Documents, Notifications | Immutable decision/grant, approved categories, expiry and NDA linkage | 6 |
| `access.rejected` | Access | Deals, Documents, Notifications | Decision and requester-safe reason code | 6 |
| `access.requested` | Access | Deals, Documents, Notifications | Requester/represented party, deal, categories and purpose reference | 6 |
| `access.revoked` | Access | Deals, Documents, Notifications | Grant and new policy version; invalidate subsequent delivery | 6 |
| `agreement.sent` | Agreements | Deals, Settlement, Notifications | Issued version/hash and signer routing references | 11 |
| `agreement.signed` | Agreements | Deals, Settlement, Notifications | All required current-version signers and validated provider receipts | 11 |
| `agreement.version_created` | Agreements | Deals, Settlement, Notifications | Immutable agreement version and source terms/evidence references | 11 |
| `ai.analysis_completed` | Intelligence | Contextual workspace | Artifact/prompt/model route and source-policy manifest references | 7 |
| `analytics.recorded` | Analytics | Aggregate reporting | Allowlisted minimized consent/purpose-bound event | 4 |
| `asset_transfer.completed` | Asset Transfer | Deals, Settlement, Notifications | Required transfer items confirmed and inspection accepted under policy; supports RELEASE_PENDING, not provider release | 12 |
| `asset_transfer.item_completed` | Asset Transfer | Deals, Settlement, Notifications | Exact item, recipient confirmation and immutable evidence references | 12 |
| `asset_transfer.started` | Asset Transfer | Deals, Settlement, Notifications | Transfer/checklist and signed agreement references | 12 |
| `audit.recorded` | Audit | Protected archive | Durable audit sequence/reference and archive checkpoint scheduling | 1 |
| `billing.invoice_created` | Billing | Notifications | Invoice/customer/subscription and provider account reference | 14 |
| `category.changed` | Marketplace | Search | Taxonomy revision and affected public projection references | 3 |
| `compliance.case_created` | Compliance | Assigned operations, Notifications | Case/category and restricted subject/scope reference | 2 |
| `conversation.created` | Messaging | Notifications | Conversation and explicit participant/deal scope | 6 |
| `deal.completed` | Deals | Projects, Portfolio, Notifications | CLOSED record, reconciled settlement and final rights/transfer references | 9 |
| `deal.created` | Deals | Projects, Portfolio, Notifications | Single project, policy version, parties and INQUIRY history | 6 |
| `deal.disputed` | Deals | Projects, Portfolio, Notifications | Dispute reference and saved stage; hold applicable operations | 9 |
| `deal.transitioned` | Deals | Projects, Portfolio, Notifications | Prior/new stage, command and validated evidence references | 6 |
| `deal_cart.changed` | Deal Cart | Analytics | Cart version/item references and private owner/team scope | 5 |
| `diligence.completed` | Diligence | Deals, Notifications | Plan version and all mandatory review/exception references | 10 |
| `diligence.started` | Diligence | Deals, Notifications | Plan/template version and accepted terms reference | 10 |
| `diligence.task_completed` | Diligence | Deals, Notifications | Task and authorized PASSED/allowed exception review | 10 |
| `diligence.task_updated` | Diligence | Deals, Notifications | Task/submission/review revision and safe status metadata | 10 |
| `document.accessed` | Documents | Data Room, owning workflow, Notifications | Authorized operation/result and delivery evidence; issuance is distinct from view | 8 |
| `document.policy_changed` | Documents | Data Room, owning workflow, Notifications | Document/scope policy version and invalidation reason | 8 |
| `document.uploaded` | Documents | Data Room, owning workflow, Notifications | Quarantined version and finalized upload reference; not clean or public | 3 |
| `document.version_created` | Documents | Data Room, owning workflow, Notifications | Immutable version and processing-state reference; delivery still requires CLEAN | 3 |
| `escrow.funded` | Settlement | Deals, Notifications | Authoritative matched funding threshold and journal evidence | 11 |
| `feature_flag.changed` | Feature Flags | Capability evaluation, Observability | Flag version, scoped environment/audience and approval reference | 1 |
| `loi.sent` | Offers | Deals, Notifications | LOI version/hash and required signers | 9 |
| `loi.signed` | Offers | Deals, Notifications | LOI exact-version signature evidence | 9 |
| `message.sent` | Messaging | Notifications | Message reference and permitted recipient scope; no body in event | 6 |
| `moderation.actioned` | Admin | Projects, Compliance | Case, authorized decision and affected publication scope | 3 |
| `nda.expired` | NDA | Deals, Access, Documents, Notifications | NDA version and expiry; revoke dependent capabilities | 8 |
| `nda.sent` | NDA | Deals, Access, Documents, Notifications | NDA version/hash and required signer references | 8 |
| `nda.signed` | NDA | Deals, Access, Documents, Notifications | Same-version required signature evidence; grant checks still apply | 8 |
| `notification.delivered` | Notifications | Observability | Recipient-safe notification and provider delivery receipt; not proof of reading | 2 |
| `offer.accepted` | Offers | Deals, Notifications | Exact accepted revision, authority and rights reservation reference | 9 |
| `offer.countered` | Offers | Deals, Notifications | Parent/new revision and supersession decision | 9 |
| `offer.expired` | Offers | Deals, Notifications | Exact unaccepted revision and server deadline evidence | 9 |
| `offer.submitted` | Offers | Deals, Notifications | Immutable current revision, parties, expiry and permitted terms reference | 9 |
| `organization.created` | Organizations | Authorization, Notifications | Organization and initial owner membership references | 2 |
| `organization.member_added` | Organizations | Authorization, Notifications | Organization/member and accepted invitation reference | 2 |
| `organization.membership_changed` | Organizations | Authorization, Notifications | Member role/status version and revocation impact | 2 |
| `portfolio.entry_created` | Portfolio | Notifications | Holder, completed Deal and retained rights reference | 12 |
| `project.approved` | Projects | Search, Marketplace, Notifications | Reviewed revision, reviewer and decision reference | 3 |
| `project.created` | Projects | Search, Marketplace, Notifications | Owner, project and initial draft revision | 3 |
| `project.paused` | Projects | Search, Marketplace, Notifications | Visibility removal and reason reference | 3 |
| `project.published` | Projects | Search, Marketplace, Notifications | Approved published revision and public eligibility version | 3 |
| `project.sold` | Projects | Search, Marketplace, Notifications | Disposition and completed acquisition/reservation references | 3 |
| `project.submitted` | Projects | Search, Marketplace, Notifications | Immutable submitted revision and readiness evidence | 3 |
| `project.transitioned` | Projects | Search, Marketplace, Notifications | Prior/new state, command, aggregate version and evidence references | 3 |
| `project.updated` | Projects | Search, Marketplace, Notifications | New revision and changed section identifiers | 3 |
| `repository.analysis_completed` | Intelligence | Verification, Projects | Connection, commit, analyzer version and authorized derived artifact | 7 |
| `reputation.updated` | Reputation | Marketplace | Versioned safe score and input evidence references | 12 |
| `review.published` | Reputation | Reputation, Notifications | Approved review revision and eligible completed relationship | 12 |
| `risk.detected` | Risk | Compliance, owning action gate | Risk alert/policy version and proposed deterministic gate | 2 |
| `saved_search.changed` | Search | Notifications | Saved query/filter schema version and cadence | 4 |
| `search.index_updated` | Search | Observability | Projection generation/checkpoint, never business authority | 4 |
| `settlement.created` | Settlement | Deals, Risk, Notifications | Settlement, agreement and provider/account/environment capability references | 11 |
| `settlement.failed` | Settlement | Deals, Risk, Notifications | Confirmed irrecoverable outcome with resolved liabilities; never transport timeout | 11 |
| `settlement.funding_pending` | Settlement | Deals, Risk, Notifications | Confirmed escrow setup and safe funding-instruction reference | 11 |
| `settlement.reconciled` | Settlement | Deals, Risk, Notifications | Reconciliation run, authoritative watermark and discrepancy references | 11 |
| `settlement.release_requested` | Settlement | Deals, Risk, Notifications | Frozen operation, amount/currency, milestone, destination and approvals | 12 |
| `settlement.released` | Settlement | Deals, Risk, Notifications | Authoritative final disbursement and reconciled journal references | 12 |
| `subscription.changed` | Billing | Entitlements, Notifications | Plan/entitlement version and authoritative billing lifecycle receipt | 14 |
| `user.profile_updated` | Identity | Notifications, Authorization | Profile revision and permitted projection change | 2 |
| `user.registered` | Identity | Notifications, Authorization | New user reference and pending verification state | 2 |
| `user.session_revoked` | Identity | Notifications, Authorization | Revoked session reference/audience and security version | 2 |
| `user.updated` | Identity | Notifications, Authorization | Changed safe field names and account security version | 2 |
| `user.verified` | Identity | Notifications, Authorization | User and exact verified claim/challenge reference | 2 |
| `verification.completed` | Verification | Projects, Compliance, Notifications | Claim, evidence class, reviewer and validity/coverage | 7 |
| `verification.failed` | Verification | Projects, Compliance, Notifications | Failed claim and restricted decision reference; no raw KYC | 7 |
| `verification.started` | Verification | Projects, Compliance, Notifications | Subject and claim type with scoped verification reference | 7 |
| `watchlist.changed` | Marketplace | Analytics | List version/item reference and scope | 4 |

Verification email and publication-ownership verification use the Verification/Identity contracts in earlier phases; full evidence providers arrive in Phase 7. Protected document delivery/policy events may begin in the Phase 3 media kernel; full VDR arrives in Phase 8. Later phases extend the same contracts rather than bypassing early controls.

## Compatibility and test gates

Event schema changes require producer/consumer fixtures, explicit version and upgrade/replay strategy. Additive changes still undergo privacy review. Consumers reject unsupported required semantics into review; they never guess financial state. Dead-letter redrive records actor, reason, consumer/version, original IDs and outcome. Erasure/retention removes disallowed content according to policy without deleting necessary operation identities and audit provenance.

Phase 1 verifies crash-before/after-dispatch, lease expiry, duplicate consumption and Redis rebuild with real PostgreSQL. Feature phases test every listed event they emit, authorization changes while queued and malformed/version-incompatible payloads. Phase 11–12 adds provider timeout, callback conflict and reconciliation invariants. The Phase 0 checker verifies event registration and catalog references, not runtime delivery.
