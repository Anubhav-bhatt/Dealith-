# Offer, diligence and transfer model

Status: Phase 0 baseline, 2026-09-07. Authority: master §§7, 24, 32–38 and 88. Canonical entities are in [data model](DATA_MODEL.md); transitions in [Deal state machine](DEAL_STATE_MACHINE.md). This document specifies evidence and commands, not legal templates or implemented transactions.

## Deal-type policy and immutable offers

Every Deal pins a versioned DealTypePolicy, project and represented buyer/seller parties. Policy selects signatories, NDA/LOI, diligence template, agreement, settlement rail, transferable rights, inspection and completion rules. Initial executable policies use positive fiat and provider-managed, fully funded escrow. Acquisition, code/IP purchase and licensing activate only when their complete policy passes the relevant sandbox gates. Other structures remain represented but execution disabled as recorded in [ADR-016](adr/ADR-016-scope-clarifications.md).

Offer contains a negotiation chain; OfferRevision contains exact decimal-string amount/currency, structure, deposit, included/excluded rights, conditions, expiry, author, parent revision and notes. Submitted revisions are immutable. Countering creates a child in the same Offer and supersedes the prior actionable revision atomically. Statuses are DRAFT, SUBMITTED, VIEWED, COUNTERED, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED and SUPERSEDED. Viewing is separate from assent; chat text is never a decision.

Submit/counter/reject/withdraw/accept commands validate actor capacity, current revision, expected aggregate version, server clock, policy and idempotency. OfferDecision records immutable decisions. Accepting locks the Deal and applicable ProjectReservation through owning services in one transaction; exactly one conflicting exclusive rights reservation wins. Accepted terms, deal transition, reservation, audit and outbox commit together. A nonexclusive license may coexist only within its rights policy; accepting it does not imply sale of the listing.

| Action | Evidence before commit | Rejection cases |
|---|---|---|
| Submit/counter | Complete valid terms, author mandate, immutable revision and valid future expiry | Wrong party, stale version, unsupported deal type, invalid precision |
| Accept | Current unexpired recipient-addressed revision, signatory authority, free compatible rights and policy | Concurrent winner, expired/superseded revision, changed authority, contradictory currency/terms |
| Reject/withdraw/expire | Exact revision, permitted actor or clock worker, no completed acceptance being overwritten | Cannot retrospectively erase accepted obligations |
| LOI send/sign | LetterOfIntentVersion binds accepted terms, exact document hash, required signers and provider evidence | Old envelope/signature, missing signer, unauthorized template or waiver |

LOI is independent of Offer and Agreement. Policy may explicitly allow both parties to waive LOI, with recorded reasons and assent. A waiver cannot silently skip diligence, agreement, funding or inspection. LOI binding-clause metadata informs cancellation review; it is not interpreted by AI as legal clearance.

## Diligence plan and review

DiligenceTemplate is versioned by asset/deal type; DiligencePlan snapshots it and the accepted OfferRevision. Categories are corporate, financial, tax, legal, technology, cybersecurity, operations, HR, customers, vendors, IP, compliance and infrastructure. Each task has owner, separate reviewer, due date, category, risk, evidence requirements, blockers and decision history.

Task statuses preserve the master vocabulary: NOT_STARTED, REQUESTED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, NEEDS_CLARIFICATION, PASSED, FAILED, WAIVED, NOT_APPLICABLE. Domain commands move tasks through request/work/submit/review; clarification reopens work with the prior submission preserved. Failed findings remain visible until a new reviewed submission resolves them. Waiver or non-applicability requires explicit policy permission, designated reviewer authority and reason; mandatory legal/security requirements cannot be waived by a generic UI toggle.

DiligenceEvidence references exact CLEAN DocumentVersion or immutable authorized repository/provider evidence, never mutable URLs. DiligenceComment has task/participant visibility; DiligenceReview records outcome, reviewer capacity, version and reasons. A task's presence does not grant its evidence access. Completion locks/rechecks required tasks, current evidence and risk holds; all mandatory outcomes must be satisfied or explicitly permitted exceptions recorded. A later material term/evidence change opens a reviewed plan revision and blocks agreement progression until resolved.

## Agreements, transfer and final rights

AgreementVersion pins accepted OfferRevision, relevant diligence review, approved terms, required signers, currency/amount, provider settlement capability and transfer policy. Issued versions are immutable. Changes invalidate/supersede the signing package and its dependent approvals. Only authenticated provider evidence for all current required signers supports AGREEMENT_SIGNED. A browser return is provisional. Agreement content and templates require the [compliance gates](COMPLIANCE_BOUNDARIES.md).

AssetTransfer and its items originate from the signed agreement after confirmed required funding. Items cover source repository, domain, cloud resources, database/export, app-store listing, social/email/analytics accounts, third-party SaaS, customer contracts, IP assignment, documentation, secure credential rotation and transition support as applicable. Each item records responsible owner, intended recipient, due date, requirement, evidence and dispute marker. Provider capability and contract assignability must be checked; a seller cannot promise that every third-party account is transferable.

Separate handover submission, intended-recipient confirmation and final inspection acceptance. Evidence identifies resource, version, recipient, observation time and verifying source. Credentials are transferred only through a separately controlled process; store proof of delivery/rotation, never reusable secrets in messages, logs or ordinary evidence fields. Inspect that old owner access is revoked where required and the buyer can exercise agreed rights.

`asset_transfer.completed` records required transfer-item confirmation and accepted inspection under policy at the guarded transition to RELEASE_PENDING (D026). Entering INSPECTION (D024) requires submitted evidence and does not emit this completion event. Neither event nor stage means funds released or Deal CLOSED. Inspection begins at the policy-defined evidence milestone, uses a controlled clock/deadline and exposes a dispute action. No silent automatic acceptance without an explicitly approved policy and tested notification/objection rules. Release requires current recipient acceptance and all [settlement](SETTLEMENT_ARCHITECTURE.md) guards. CLOSED additionally requires reconciled final liabilities, retained evidence and durable scheduling of the idempotent PortfolioEntry projection. Portfolio consumes deal.completed after CLOSED; a delayed projection is retried with a visible pending state and never creates new rights. Acquisition disposition marks the appropriate project SOLD; nonexclusive license completion preserves seller rights and listing eligibility.

## Recovery and delivery gates

Disputes record the prior stage and freeze applicable unsent operations. Resolve through allowed transitions after reconciling money, rights and evidence; staff cannot set provider facts manually. Refunded cancellation cannot erase signed history. A revoked member cannot approve an already queued task or transfer by replaying an earlier session.

Phase 6 establishes the Deal participant kernel; 9 implements offers/LOI and all allowed/denied transitions; 10 implements diligence; 11 implements signing/settlement in sandbox; 12 completes transfer/inspection/portfolio in sandbox. Required tests include simultaneous acceptance, stale terms, missing signers, evidence substitution, unauthorized waiver, wrong recipient, incomplete transfer, dispute during release and idempotent close. [E2E matrix](E2E_TEST_MATRIX.md) supplies IDs; production money remains a Phase 15 gate.
