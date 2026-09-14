# Project state machine

Status: frozen architecture, 2026-09-06. Source: master §16 and Phase 0 §13. Exactly **17 states**. The [lifecycle registry](architecture/LIFECYCLE_REGISTRY.json) is the machine-readable allowlist; the tables below describe the same edges. `ProjectStage` (business maturity) is a different field and cannot substitute for listing lifecycle.

A new project starts at `DRAFT` through `project.create`, emits `project.created`, and records its owner and revision. Creation is not an edge from an invented status. Every subsequent edge requires authenticated actor or explicit service identity, RBAC+ABAC authorization, current expected aggregate version, database transaction, audit, and `project.transitioned`. The per-edge events below are additional signals. No direct status PATCH exists.

Owners means an individual legal owner or an active organization member with this project capability; OWNER is not a new global role. Analysts need scoped assignment, reason and separation from the seller. Service actors execute named commands with least privilege and recheck domain policy; an event alone cannot authorize a transition.

Public reads expose only the last approved, current public revision. Editing live content creates a separate ProjectRevision review without changing the live Project status; material confidentiality/ownership changes pause or suspend immediately. A revision follows review metadata, not an alternative project-state vocabulary. Approved replacement publication atomically swaps the revision and emits project.published; same-state content commands are not lifecycle edges.

Exclusive acceptance creates a ProjectReservation unique over the transferable rights; unsuccessful inquiries and offers do not reserve or hide a project. Nonexclusive license deals can leave a project PUBLISHED and create independent scoped rights grants. CLOSED dispositional acquisitions make the matching listing SOLD; a license is never mislabeled SOLD. PAUSED can retain an active reservation, and republishing cannot evade it. Suspension/rejection changes discoverability and blocks sensitive new actions; it never erases executed agreements or changes provider financial truth. When a closing deal finds its project SUSPENDED/REJECTED, it records disposition in the reservation/ownership record; moderation resolves to PAUSED and then SOLD through the guarded path before any relisting. A rejected disposition cannot be relisted until that recorded disposition is reconciled.

ARCHIVED is terminal for this listing record. New ownership uses a new listing with provenance; immutable historical references remain. WITHDRAWN and REJECTED may enter a new reviewed revision through the listed edges. Cancellation of a listing never cancels a deal automatically.

## State adjacency

Every state row references the detailed edge guards below. An em dash means no incoming/outgoing edge; creation is noted separately.

| State | Allowed incoming states | Allowed outgoing states | Actor, permission, validation and events |
| --- | --- | --- | --- |
| DRAFT | creation only | INCOMPLETE, READY_FOR_REVIEW, WITHDRAWN | P001, P002, P030 |
| INCOMPLETE | DRAFT, READY_FOR_REVIEW, CHANGES_REQUESTED, APPROVED, SCHEDULED, PAUSED, REJECTED, WITHDRAWN | READY_FOR_REVIEW, WITHDRAWN | P001, P003, P004, P008, P016, P017, P020, P031, P040, P041 |
| READY_FOR_REVIEW | DRAFT, INCOMPLETE, CHANGES_REQUESTED | INCOMPLETE, SUBMITTED, WITHDRAWN | P002, P003, P004, P005, P009, P032 |
| SUBMITTED | READY_FOR_REVIEW | UNDER_REVIEW, WITHDRAWN, SUSPENDED | P005, P006, P033, P042 |
| UNDER_REVIEW | SUBMITTED | CHANGES_REQUESTED, APPROVED, REJECTED, WITHDRAWN, SUSPENDED | P006, P007, P010, P011, P034, P043 |
| CHANGES_REQUESTED | UNDER_REVIEW | INCOMPLETE, READY_FOR_REVIEW, WITHDRAWN, SUSPENDED | P007, P008, P009, P035, P044 |
| APPROVED | UNDER_REVIEW, SCHEDULED | SCHEDULED, PUBLISHED, INCOMPLETE, WITHDRAWN, SUSPENDED | P010, P012, P013, P015, P016, P036, P045 |
| SCHEDULED | APPROVED | PUBLISHED, APPROVED, INCOMPLETE, WITHDRAWN, SUSPENDED | P012, P014, P015, P017, P037, P046 |
| PUBLISHED | APPROVED, SCHEDULED, PAUSED, UNDER_OFFER, DEAL_IN_PROGRESS | PAUSED, UNDER_OFFER, WITHDRAWN, SUSPENDED | P013, P014, P018, P019, P021, P023, P026, P038, P047 |
| PAUSED | PUBLISHED, UNDER_OFFER, DEAL_IN_PROGRESS, SUSPENDED | PUBLISHED, INCOMPLETE, DEAL_IN_PROGRESS, SOLD, WITHDRAWN, SUSPENDED | P018, P019, P020, P024, P027, P028, P029, P039, P048, P051 |
| UNDER_OFFER | PUBLISHED | DEAL_IN_PROGRESS, PUBLISHED, PAUSED, SUSPENDED | P021, P022, P023, P024, P049 |
| DEAL_IN_PROGRESS | UNDER_OFFER, PAUSED | SOLD, PUBLISHED, PAUSED, SUSPENDED | P022, P025, P026, P027, P028, P050 |
| SOLD | DEAL_IN_PROGRESS, PAUSED | ARCHIVED | P025, P029, P053 |
| WITHDRAWN | DRAFT, INCOMPLETE, READY_FOR_REVIEW, SUBMITTED, UNDER_REVIEW, CHANGES_REQUESTED, APPROVED, SCHEDULED, PUBLISHED, PAUSED | INCOMPLETE, ARCHIVED | P030, P031, P032, P033, P034, P035, P036, P037, P038, P039, P041, P054 |
| REJECTED | UNDER_REVIEW, SUSPENDED | INCOMPLETE, ARCHIVED | P011, P040, P052, P055 |
| SUSPENDED | SUBMITTED, UNDER_REVIEW, CHANGES_REQUESTED, APPROVED, SCHEDULED, PUBLISHED, PAUSED, UNDER_OFFER, DEAL_IN_PROGRESS | PAUSED, REJECTED | P042, P043, P044, P045, P046, P047, P048, P049, P050, P051, P052 |
| ARCHIVED | SOLD, WITHDRAWN, REJECTED | — | P053, P054, P055 |

## Exhaustive transition contract

The common authorization/transaction/audit requirements above apply in addition to each guard. No other directed edge is valid.

| ID | From | To | Actor | Required permission | Validation / effects required before commit | Emitted events |
| --- | --- | --- | --- | --- | --- | --- |
| P001 | DRAFT | INCOMPLETE | owner | project.edit | Readiness assessment fails required asset/stage/deal-type fields. | project.transitioned |
| P002 | DRAFT | READY_FOR_REVIEW | owner | project.edit | Version passes complete readiness assessment; evidence requirements present. | project.transitioned |
| P003 | INCOMPLETE | READY_FOR_REVIEW | owner | project.edit | All blocking readiness findings resolved on current version. | project.transitioned |
| P004 | READY_FOR_REVIEW | INCOMPLETE | owner/system | project.edit | An edit or expired evidence invalidates readiness; capture reasons. | project.transitioned |
| P005 | READY_FOR_REVIEW | SUBMITTED | owner | project.submit | Verified ownership and submitter authority; immutable revision submitted; prohibited-listing checks pass. | project.transitioned, project.submitted |
| P006 | SUBMITTED | UNDER_REVIEW | review analyst | project.review | Reviewer assigned; no self-review; submitted revision hash matches. | project.transitioned |
| P007 | UNDER_REVIEW | CHANGES_REQUESTED | review analyst | project.review | Specific correction reasons and affected fields recorded. | project.transitioned |
| P008 | CHANGES_REQUESTED | INCOMPLETE | owner | project.edit | Open correction revision; previous review remains immutable. | project.transitioned |
| P009 | CHANGES_REQUESTED | READY_FOR_REVIEW | owner | project.edit | Corrected revision satisfies all requested changes and readiness. | project.transitioned |
| P010 | UNDER_REVIEW | APPROVED | review analyst | project.approve | Ownership verified; current evidence; moderation and jurisdiction eligibility; immutable approved revision. | project.transitioned, project.approved |
| P011 | UNDER_REVIEW | REJECTED | review analyst | project.reject | Reason and evidence recorded; appeal path disclosed. | project.transitioned |
| P012 | APPROVED | SCHEDULED | owner | project.publish | Valid future UTC publication time; approval/evidence current. | project.transitioned |
| P013 | APPROVED | PUBLISHED | owner | project.publish | Publish exact approved revision; eligibility and evidence rechecked. | project.transitioned, project.published |
| P014 | SCHEDULED | PUBLISHED | scheduler | project.publish.scheduled | Scheduled time reached; unchanged approved revision; live flags, owner authority and eligibility still valid. | project.transitioned, project.published |
| P015 | SCHEDULED | APPROVED | owner | project.schedule.cancel | Cancel schedule before publication. | project.transitioned |
| P016 | APPROVED | INCOMPLETE | owner/system | project.edit | Material prepublication edit or evidence expiry invalidates approval. | project.transitioned |
| P017 | SCHEDULED | INCOMPLETE | owner/system | project.edit | Material change or eligibility expiry invalidates scheduled approval. | project.transitioned |
| P018 | PUBLISHED | PAUSED | owner/system | project.pause | Owner pause or non-fraud evidence expiry; public projection revoked. | project.transitioned, project.paused |
| P019 | PAUSED | PUBLISHED | owner | project.publish | Current approved revision and ownership eligibility; no reservation, suspension or risk block. | project.transitioned, project.published |
| P020 | PAUSED | INCOMPLETE | owner | project.edit | Owner elects to replace approved listing; new revision requires review. | project.transitioned |
| P021 | PUBLISHED | UNDER_OFFER | Deals coordinator | project.reserve | Exclusive OfferRevision accepted through Offer/Deal services; acquire unique active rights reservation atomically. | project.transitioned |
| P022 | UNDER_OFFER | DEAL_IN_PROGRESS | Deals coordinator | project.commit | Reserved deal has fully signed matching agreement and no risk block. | project.transitioned |
| P023 | UNDER_OFFER | PUBLISHED | Deals coordinator | project.reservation.release | Reservation ended; no binding obligations or unresolved funds; listing approval still valid. | project.transitioned, project.published |
| P024 | UNDER_OFFER | PAUSED | Deals coordinator/owner | project.pause | Pause discovery without cancelling accepted offer, reservation, or existing deal. | project.transitioned, project.paused |
| P025 | DEAL_IN_PROGRESS | SOLD | completion coordinator | project.complete | Dispositional acquisition closed; settlement final; mandatory transfer and inspection confirmed; reservation belongs to closing deal. | project.transitioned, project.sold |
| P026 | DEAL_IN_PROGRESS | PUBLISHED | completion coordinator | project.reservation.release | Deal lawfully terminated with funds/rights resolved, or time-bound exclusive license reservation ended; original owner still has listing rights; current approval. | project.transitioned, project.published |
| P027 | DEAL_IN_PROGRESS | PAUSED | completion coordinator | project.pause | Funds/rights resolved but listing requires revalidation before discoverability. | project.transitioned, project.paused |
| P028 | PAUSED | DEAL_IN_PROGRESS | Deals coordinator | project.commit | Existing reservation for accepted deal; matching agreement fully signed; pause was discoverability-only. | project.transitioned |
| P029 | PAUSED | SOLD | completion coordinator | project.complete | Deal closed with verified final settlement and dispositional transfer; this paused listing retains matching reservation. | project.transitioned, project.sold |
| P030 | DRAFT | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P031 | INCOMPLETE | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P032 | READY_FOR_REVIEW | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P033 | SUBMITTED | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P034 | UNDER_REVIEW | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P035 | CHANGES_REQUESTED | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P036 | APPROVED | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P037 | SCHEDULED | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P038 | PUBLISHED | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P039 | PAUSED | WITHDRAWN | owner | project.withdraw | No active rights reservation, binding deal obligation or unresolved transfer; preserve historical deal access. | project.transitioned |
| P040 | REJECTED | INCOMPLETE | owner with review authorization | project.appeal.revise | Accepted appeal permits a new revision; original rejection remains. | project.transitioned |
| P041 | WITHDRAWN | INCOMPLETE | owner | project.relist | Ownership current; no conflicting disposition; a new review is required. | project.transitioned |
| P042 | SUBMITTED | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P043 | UNDER_REVIEW | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P044 | CHANGES_REQUESTED | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P045 | APPROVED | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P046 | SCHEDULED | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P047 | PUBLISHED | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P048 | PAUSED | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P049 | UNDER_OFFER | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P050 | DEAL_IN_PROGRESS | SUSPENDED | compliance/moderator | project.suspend | Reason and case recorded; block new discovery and sensitive commands; preserve deals, financial truth and review access. | project.transitioned |
| P051 | SUSPENDED | PAUSED | compliance/moderator | project.reinstate | Case resolution and independent approval; default no public exposure; active reservation retained. | project.transitioned |
| P052 | SUSPENDED | REJECTED | compliance/moderator | project.reject | Confirmed prohibition; no automatic cancellation of deals or funds; supervised resolution required. | project.transitioned |
| P053 | SOLD | ARCHIVED | owner/retention worker | project.archive | No open dispute, legal hold conflict, or unresolved obligation; archive visibility only; immutable history retained. | project.transitioned |
| P054 | WITHDRAWN | ARCHIVED | owner/retention worker | project.archive | No open dispute, legal hold conflict, or unresolved obligation; archive visibility only; immutable history retained. | project.transitioned |
| P055 | REJECTED | ARCHIVED | owner/retention worker | project.archive | No open dispute, legal hold conflict, or unresolved obligation; archive visibility only; immutable history retained. | project.transitioned |

Total: 17 states, 55 valid directed transitions; creation handled separately.

## Concurrency and verification

The domain command locks or compares the aggregate version, checks current grants and restrictions within the transaction, writes immutable transition history and audit, and appends the outbox record. Cross-module critical commands use exported services and a shared transaction coordinator, never foreign-table writes. External I/O runs after durable intent through workers. Consumers do not bypass guards. Financial/rights reservations require unique constraints and serializable retry where multiple aggregates race.

Phase 0 validation checks unique edges, exact canonical state sets, reachability, adjacency parity, nonempty actor/permission/guard/event contracts and named event registration. Phase 9 must test every listed edge and every unlisted ordered state pair, including stale versions, insufficient permission and failed guards; Phase 3 tests project transitions. Runtime evidence is not claimed in Phase 0.

Event ownership follows [DOMAIN_EVENTS](DOMAIN_EVENTS.md): additional edge events are facts emitted once by the owning module in the coordinated transaction, or already committed causal facts consumed by this transition. The lifecycle owner emits its transition event and must not re-emit a consumed Access/NDA/Settlement fact. Event receipt never bypasses the edge guard.
