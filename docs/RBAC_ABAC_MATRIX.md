# RBAC + ABAC authorization matrix

Status: Phase 0 architecture freeze. Source: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md), sections 4, 8, 14, 23–26, 33–38 and 82. This is a normative design, not a claim that controls exist. Related: [security](SECURITY_MODEL.md), [data room](DATA_ROOM_SECURITY_MODEL.md), [API boundaries](API_BOUNDARIES.md).

## Enforcement contract

The API is the authorization authority. Every command, query, object lookup, collection filter, field projection, export, worker, realtime subscription and AI retrieval must evaluate policy. UI controls are advisory. Default deny; an explicit deny, expired grant, risk hold or unsupported jurisdiction wins over an allow. A feature flag or subscription entitlement can restrict a permission, never confer it.

The policy interface is `authorize(actor, action, resource, context) -> {allowed, reasonCode, policyVersion, fieldMask, obligations}`. Inputs are server-resolved attributes: account/session status, authentication assurance and age, active memberships and role bindings, resource owner, deal-side representation, explicit grants, current NDA/version/signers, jurisdiction capability, risk/retention constraints and current aggregate version. Client-supplied organization IDs are resource selectors, not authority. Do not trust roles in a request body or a stale session snapshot.

The application service resolves a resource through a scoped repository, evaluates action policy, performs validation and writes under an aggregate lock/optimistic version in one database transaction. Recheck mutable authority inside the committing transaction for disclosure, membership, offer acceptance, signatures, money and transfer actions. Record policy version and decision evidence in the audit record. Workers act as named service principals with a purpose, tenant/resource scope and fresh policy checks, never as an implicit super admin.

## Roles and their scope

Roles are composable capabilities, not a hierarchy. Founder/buyer intent selection does not grant verification, ownership, organizational signing authority or investment eligibility.

| Role | Scope and permitted baseline | Explicit limits |
|---|---|---|
| VISITOR | Anonymous; approved public discovery | No private object existence, membership or mutations |
| USER | Own identity, profile, sessions, bookmarks and evaluation workspace | No private listing or deal rights by registration alone |
| FOUNDER | Create and maintain owned or delegated projects | Cannot approve own verification or listing review |
| SELLER | Represent a verified asset owner with an action-specific delegation | Cannot accept on behalf of buyer or release money alone |
| BUYER | Evaluate, request access and negotiate for own buying principal | Access requires owner grant; buyer intent is not qualification |
| INVESTOR | Buyer-like evaluation for enabled investment types | Jurisdiction, eligibility and compliance gate required |
| CORPORATE_SCOUT | Evaluate for an active organization membership | No organization signing authority unless explicitly delegated |
| ADVISOR | Invited deal participant with categories/tasks delegated | No implied source, legal signature or money authority |
| LEGAL_PARTICIPANT | Invited legal review or explicitly named signer | Cannot sign for other parties or browse all deal evidence |
| ORGANIZATION_ADMIN | Manage members, invitations and organization settings | Does not automatically become a deal participant or read all private notes |
| VERIFICATION_ANALYST | Assigned verification cases and necessary evidence | Cannot approve own identity/assets or unrelated cases |
| COMPLIANCE_ANALYST | Assigned compliance cases, risk holds and lawful KYC review | No direct money movement or unrestricted document discovery |
| DEAL_OPERATIONS | Assigned deal support, reconciliation and dispute cases | No unilateral settlement release, signature or source-code access |
| SUPPORT_AGENT | Redacted support metadata and approved support workflows | No raw KYC, confidential evidence, impersonation or financial override |
| PLATFORM_ADMIN | Moderation, catalog, plans and approved flags | No blanket private documents, KYC, signing or settlement privilege |
| SUPER_ADMIN | Time-limited, approved emergency platform operations | No ambient bypass; break-glass scope, MFA, reason and dual approval |

Organization roles attach to `OrganizationMember`; platform roles attach to controlled staff bindings; deal action rights attach to `DealParticipant` plus explicit delegation. A user can belong to buyer and seller organizations but cannot represent both sides for conflicting approval/signature/release actions on the same deal. Such conflicts enter manual review.

## Reusable ABAC predicates

| Code | Required predicate |
|---|---|
| A | Authenticated, active account, valid unrevoked server session |
| M | Active membership of the represented organization, or resource explicitly owned by the individual |
| O | Resource owner or active action-specific owner delegation; organization membership alone is insufficient |
| P | Active, accepted `DealParticipant` for this exact deal and represented party |
| G | Owner-approved, unexpired, unrevoked `AccessGrant` for principal, resource/category and purpose |
| N | Required NDA fully signed by required parties, bound to the current access scope/version and currently effective |
| J | Jurisdiction, residency, deal-type eligibility, provider capability and risk policy permit the action |
| R | Resource policy, stage, version, classification and applicable retention/hold restrictions permit the action |
| S | Required MFA and fresh step-up authentication (within five minutes for sensitive commands) |
| C | Assigned case, least-privilege case scope, approved purpose and conflict-of-interest check |
| D | Two distinct authorized approvers; no self-approval; approval bound to exact version/hash |

`M` evaluates the represented principal; it does not require buyer and seller to share a tenant. `P` does not imply `G`. `N` does not create `G`. Case access uses its own audited `C` policy and does not manufacture customer membership or NDAs.

## Resource/action matrix

Each row includes the baseline RBAC candidates and all additional predicates. Omitted permissions are denied. Where no NDA is required, `N` means a recorded explicit no-NDA policy; absence of an NDA record is not an exception.

| ID | Resource/action | Candidate role or service | ABAC and obligations |
|---|---|---|---|
| AUTHZ-01 | Public project/profile/category read | All roles | Published/safe public projection only; exclude private counts, draft versions and hidden fields |
| AUTHZ-02 | Project create/edit/submit/preview | FOUNDER, SELLER | A M O J R; preview evaluated as selected audience; cannot modify approved public revision silently |
| AUTHZ-03 | Project review/publish/suspend | PLATFORM_ADMIN; assigned reviewer | A S C R; reviewer independent of owner; approved immutable revision; suspension reason audited |
| AUTHZ-04 | Organization/member/invitation manage | ORGANIZATION_ADMIN | A M O S R; cannot grant platform role, remove last admin or promote above own delegation |
| AUTHZ-05 | Organization billing manage | ORGANIZATION_ADMIN with billing delegation | A M R; step-up for payment method changes; no deal money privileges |
| AUTHZ-06 | Watchlist/cart/compare/private notes | USER, BUYER, INVESTOR, CORPORATE_SCOUT | A M R; individual owner or explicit team share; compare uses each project's authorized projection |
| AUTHZ-07 | Access request create/withdraw/read own | BUYER, INVESTOR, CORPORATE_SCOUT, invited ADVISOR | A M J R; requester exact principal; target eligible project; no self-deal abuse |
| AUTHZ-08 | Approve/reject/revoke category access | FOUNDER, SELLER with disclosure authority | A M O J R; scope/version/expiry explicit; immutable decision history; no grant above owner's rights |
| AUTHZ-09 | NDA issue/sign/view | SELLER issuer; named participant/signer | A M P J R; sign requires S and named signer authority; legal record distinct from viewing permission |
| AUTHZ-10 | Data-room/document list/metadata/view | FOUNDER, SELLER, BUYER, INVESTOR, CORPORATE_SCOUT, ADVISOR, LEGAL_PARTICIPANT | A M P G N J R, or owner-maintenance policy A M O J R; clean version; no hidden names/folder counts |
| AUTHZ-11 | Document download/export | Same candidates as AUTHZ-10 | AUTHZ-10 plus explicit download/export allow, destination/purpose controls, watermark obligation and audit |
| AUTHZ-12 | Document upload/version/archive/policy edit | Owner or delegated uploader | A M O J R; upload grants never imply view all; legal hold blocks destructive edits; disclosure expansion audited |
| AUTHZ-13 | Restricted source/diligence evidence | Explicit technical participant | A M P G N J R S; named repository/category grant, time limit and owner consent; no public derivatives without review |
| AUTHZ-14 | Conversation read/send/attach/subscribe | Accepted conversation participants | A M P J R and exact conversation membership; attachment policy separately evaluated; no thread by guessed ID |
| AUTHZ-15 | Offer create/submit/counter/withdraw | Authorized buyer/seller representative | A M P J R; acting side/current revision; deadline and offer state valid; immutable submitted revisions |
| AUTHZ-16 | Offer accept/reject | Authorized counterparty signatory | A M P J R S; cannot accept own revision; authority for amount/type; acceptance locks exact revision |
| AUTHZ-17 | Diligence task/evidence/comment | Assigned participants, ADVISOR, LEGAL_PARTICIPANT | A M P G N J R; category/task scope; comment audience cannot exceed evidence audience |
| AUTHZ-18 | Diligence review/waiver | Named reviewer or authorized deal signatory | A M P J R; independent reviewer where required; material waiver requires S, reason and counterparty acknowledgment |
| AUTHZ-19 | Agreement draft/send/read/sign | Legal delegates and named signers | A M P G N J R; S for send/sign; exact current hash; all required signers; no signature by staff impersonation |
| AUTHZ-20 | Settlement status/funding instructions | Authorized deal financial participants | A M P J R; redacted destination; instruction generated by provider; client return URL conveys no finality |
| AUTHZ-21 | Settlement destination create/change | Authorized beneficiary representative | A M P J R S; provider verification, D and renewed agreement consent if changed; freeze release until resolved |
| AUTHZ-22 | Release/refund/cancel request | Contract-designated participants; case-assigned DEAL_OPERATIONS | A M P J R S or A C J R S for case proposal; D for operational overrides; provider confirmation required |
| AUTHZ-23 | Provider event ingest/reconcile | Dedicated provider/worker principal | Valid signature/account/env, deduplication, amount/currency/object match and state guard; service cannot bypass holds |
| AUTHZ-24 | Transfer item/evidence submit | Named transfer owner | A M P G N J R; assigned item and exact recipient; secure handover reference, no plaintext credentials |
| AUTHZ-25 | Transfer confirm/inspection/complete | Designated recipient/inspector | A M P J R S; evidence complete; no seller self-confirmation; unresolved dispute prevents release |
| AUTHZ-26 | Portfolio read/update/export | Portfolio owner or delegated team member | A M O R; completed relationship; permanent reference does not grant expired data-room access |
| AUTHZ-27 | Verification/KYC evidence read/review | Assigned VERIFICATION_ANALYST or COMPLIANCE_ANALYST | A S C J R; separate KYC vault; exact case field scope; no own-case review |
| AUTHZ-28 | Compliance hold/dispute decision | COMPLIANCE_ANALYST; delegated DEAL_OPERATIONS | A S C J R; evidence/reason; financial unlock requires D and authoritative reconciliation |
| AUTHZ-29 | Admin flags/plans/moderation/audit | PLATFORM_ADMIN with specific permission | A S C R; high-risk flag changes D; no new privilege through client flags; audit query scope/redaction |
| AUTHZ-30 | Support metadata | SUPPORT_AGENT | A S C R; redacted read model; no default impersonation; customer secrets excluded |
| AUTHZ-31 | Emergency access | SUPER_ADMIN | A S C D R; ticket, exact resource/actions, short expiry, independent alert/review; cannot erase audit or sign as customer |
| AUTHZ-32 | Reviews/reputation | Completed eligible counterparties; moderation service | A M P J R for submit; one relationship review per author; moderation and score changes audited |
| AUTHZ-33 | Notifications/analytics | Recipient; scoped analytics principal | A M R; disclose permitted aggregates only, threshold small cohorts; notification body contains no confidential content |

## Field-level disclosure classes

The eight labels are predicates, not an ordered clearance ladder. Having `DEAL_ROOM` access does not automatically reveal `PLATFORM_ONLY`, all NDA categories or all restricted diligence. Owner internal editing uses a separate owner policy; public rendering always uses the target audience's mask.

| Classification | Minimum audience predicate | Example and projection rule |
|---|---|---|
| PUBLIC | Approved safe published field | Tagline, basic technology, seller-authorized approximate ARR; no exact value embedded in formatting/source |
| AUTHENTICATED | A J R | Owner-designated nonpublic summary; no registration-based access to confidential categories |
| VERIFIED_USER | A, current relevant verification, J R | Summary only when the required verification type remains valid |
| APPROVED_BUYER | A M G J R | Exact financials for the approved category/principal; add N whenever resource requires NDA |
| NDA_REQUIRED | A M G N J R | Customer names; NDA alone never grants access |
| DEAL_ROOM | A M P G N J R | Detailed contracts in that deal's approved room/categories |
| RESTRICTED_DILIGENCE | A M P G N J R S and named restricted grant | Source repository or sensitive technical/security evidence |
| PLATFORM_ONLY | A S C J R on separate staff interface | KYC evidence; no seller, buyer or blanket platform-admin visibility |

Classifications attach to structured fields, documents and derived artifacts. The strictest applicable policy wins across nested data and joined resources. An API serializer builds an allowlisted DTO from authorized fields; forbidden properties are absent, not `null` with revealing labels. Approved aggregate/public approximations are stored as separate representations, not computed in a browser from restricted inputs. Do not include restricted values in HTML, React server payloads, TanStack hydration, metadata, source maps, CSV, snippets, embeddings, ranking inputs, notifications or analytics.

Public search indexes contain only the approved public revision and PUBLIC fields. Private queries use policy-scoped reads and cannot leak through result counts, facets, autocomplete or response timing. Confidential responses use `Cache-Control: private, no-store`; caches/AI artifacts include principal, resource and policy revision when retention is permitted. Membership/grant/NDA revocation invalidates server grants and active subscriptions; browser caches clear on logout/tenant switch. Signed-object residual capability is bounded as described in the data-room model.

## Tenancy and database protection

Organization-owned rows carry an owner reference; shared deal rows carry explicit participant edges. Tenant scoping is enforced by repositories and PostgreSQL RLS as defense in depth. Runtime roles are non-owner and lack `BYPASSRLS`; protected tables use forced row security and write checks. PostgreSQL documents owner and privileged-role bypasses, which must be tested explicitly. [PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)

Every Prisma transaction sets transaction-local actor/principal context from the authenticated service context. Connection-pool reuse must not leak context. Missing context denies access. RLS predicates model ownership **or** explicit cross-organization participant/grant edges; a single `organizationId = currentOrganization` condition is insufficient. Workers use equally explicit context; migrations use a separate credential never available to runtime containers. RLS does not replace field projection or business-stage rules.

## Required negative-access scenarios

| ID | Attempt | Required outcome |
|---|---|---|
| NEG-A01 | Guess another organization, project draft, deal or document ID | Uniform not-found/denied contract; zero unauthorized fields or mutation |
| NEG-A02 | Removed organization member reuses session, websocket or download action | New reads/writes/subscriptions denied; existing signed URL caveat measured |
| NEG-A03 | Sign NDA for project A then open project B's financials | Denied; scope and grant mismatch |
| NEG-A04 | Approved financial category requests source code/legal category | Denied including filenames, search matches and AI summaries |
| NEG-A05 | Advisor or organization admin accepts offer/signs/releases without delegation | Denied; role does not confer signatory authority |
| NEG-A06 | Seller accepts own offer revision or confirms own transfer as buyer | Denied; side and independent-actor checks |
| NEG-A07 | Support/platform admin retrieves KYC or source without case scope | Denied and suspicious access audited |
| NEG-A08 | Client modifies role, organization ID, status, amount or entitlement | Ignored/rejected input; server truth retained |
| NEG-A09 | NDA expires or risk hold begins during read/write | Recheck current predicate; no new capability/commit; in-flight delivered bytes cannot be recalled |
| NEG-A10 | Hidden financial field leaks through HTML/search/compare/export/AI | Response and derived artifact contain no restricted value |
| NEG-A11 | Buyer participant in organization A accesses unrelated deal of organization B | Denied; positive control verifies legitimate A-to-B shared deal access works |
| NEG-A12 | Break-glass staff attempts audit deletion or signing as customer | Denied even during emergency session |
| NEG-A13 | Runtime DB query lacks actor context or reuses prior tenant connection | Denied; no tenant context persists beyond transaction |
| NEG-A14 | Old provider callback or changed destination attempts release | No direct transition; frozen operation/reconciliation/manual review |

Implement these as parameterized policy/integration/API tests plus selected browser paths in [E2E matrix](E2E_TEST_MATRIX.md). Policy/catalog changes require security review, explicit migration of existing grants and deny-first compatibility testing.
