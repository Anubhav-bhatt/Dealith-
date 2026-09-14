# ADR-016: Scope, naming and early safety kernels

Status: Recorded baseline, 2026-09-07; explicit interpretation/amendment record. Sources: master §§7–9, 16, 33, 50–51, 88–96.

## Context and decision

The unchanged master is the product authority. The [inventory](../REPOSITORY_INVENTORY.md) records no existing application. Phase 0 is documentation and its verification tooling only: no feature scaffold, migrations, credentials, deployment, production resource or live provider operation. Architecture choices are reviewable baseline records; they do not fabricate human approvals. The [phase matrix](../PHASE_ACCEPTANCE_MATRIX.md) controls implementation dependencies and preserves the master's Phase 0–15 sequence.

| Subject | Canonical interpretation | Impact and verification |
|---|---|---|
| Repository layout | Master `frontend/` and `backend/` responsibilities map to `apps/{web,admin,api,worker}` and server-only `packages/backend` under ADR-002 | Explicit layout amendment; no code migration exists; PHASE-01 import/build gate |
| Documentation names | Root README maps master §92 logical names to canonical files; `DEALITH_MASTER_PROJECT_SCOPE.md` remains the preserved source | Do not create divergent duplicate masters; Phase 0 checks paths/links and source checksum |
| Entity aliases | `Profile` = master `UserProfile`; `Invitation` = `OrganizationInvitation`; `Participant` = `ConversationParticipant` | One conceptual entity per alias, not duplicate tables; physical names chosen in migrations |
| Taxonomy | `Category` is a taxonomy node; `ProjectCategory` links a listing revision | Keep classification distinct from one duplicated taxonomy entity |
| Project identity | `Project` is the stable listing/asset; `ProjectRevision` holds edit/review snapshots | Live edits cannot leak unapproved fields; status and business maturity/stage are distinct |
| State vocabulary | Preserve exactly 17 Project and 28 Deal states; supporting workflows have their own constrained statuses | No new Deal state to encode provider ambiguity; registry and negative transition tests bind vocabulary |
| Identity/authorization kernels | PHASE-02 introduces session, tenant, risk/policy and audit enforcement | Full PHASE-13 console is not a reason to delay early security |
| Publishing kernels | PHASE-03 includes ownership evidence review, minimal separate staff moderation, quarantine/scan and safe media, compliance publication blocks | Full verification arrives PHASE-07 and VDR PHASE-08; publication cannot precede its minimal trust controls |
| Communication kernel | PHASE-06 introduces minimal Deal `INQUIRY` and access/conversation context with participants, grants, confidentiality and audit | Offers and full engine remain PHASE-09; permission tests cover early Deal creation and unrelated parties |
| NDA boundary | PHASE-06 may request access/discuss safe content but cannot unlock NDA-required material before PHASE-08 signing/policy exists | Gate missing capability closed; do not use a checkbox NDA substitute |
| Financial/compliance kernels | PHASE-11 includes deterministic eligibility, holds, assigned review, authenticated callbacks and recovery before settlement sandbox | PHASE-13 expands console/casework; financial safety is never deferred to it |
| Deal Cart | Evaluation workspace and comparison of 2–5 listings; each selected opportunity starts an independent Deal | No shared checkout, obligation, listing reservation or combined settlement |
| Execution scope | Initial execution covers supported commercial acquisition, code/IP purchase and licensing using positive fiat and fully funded provider escrow | DealTypePolicy determines exact obligations; unsupported options reject server-side |
| Represented future structures | Partnership/revenue-share remain in listing/model vocabulary, but execution is disabled until supported legal/settlement policy exists | No assumption that fixed escrow implements ongoing royalty/revenue accounting |
| Investment and crypto | Investor intent may exist; regulated execution and crypto stay default-off until scoped qualified/capability approval | Neither a subscription nor frontend flag grants availability; no custody or global securities promise |
| Public/source boundary | Derived repository evidence, safe screenshots/video/links are supported; public raw source and arbitrary seller-code execution are excluded | PHASE-07 analysis is scoped/read-only; Level 4 source diligence requires explicit grant/NDA |
| Evidence retention | Preserve durable deal/audit references and required signed records, while personal content follows reviewed purpose/retention/hold policy | “Permanent record” does not authorize indefinite retention of all PII/KYC/source |

## Alternatives and consequences

Literal phase sequencing without prerequisite kernels would ship publishing/communication/settlement before their safety controls. Silently renaming entities, directories or statuses would hide scope drift. The selected record makes those dependencies visible while reserving full feature delivery for the intended phases. Planned future capability is not an unresolved Phase 0 P0 if its interface and disabled boundary are explicit; any missing correctness/security architecture remains a blocker.

## Verification and change control

Phase 0 validates the full document inventory, master traceability, domain/entity/event/state catalogs, ADRs and scenario mappings; implementation evidence starts later. Each phase report names blockers or explicit deferrals with owner, reason, impact, target gate and actual approval evidence where required. No hidden carryover, inferred review or automatic continuation into another phase is allowed. Material deviations record requirement/test/security impact and superseding ADR before acceptance. See [Definition of Done](../DEFINITION_OF_DONE.md).
