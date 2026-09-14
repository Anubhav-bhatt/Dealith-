# API boundaries and contracts

Status: Phase 0 architecture baseline, 2026-09-07. This defines interfaces to implement, not deployed endpoints or a generated OpenAPI specification. Authority: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md) §§12, 44, 52, 82–83 and the [domain map](PRODUCT_DOMAIN_MAP.md). [Authorization](RBAC_ABAC_MATRIX.md), [lifecycle](architecture/LIFECYCLE_REGISTRY.json), [security](SECURITY_MODEL.md) and [events](DOMAIN_EVENTS.md) supply the associated invariants.

## Transport and module authority

The customer and staff applications proxy their own same-origin `/api/v1` paths to NestJS. The edge strips untrusted forwarding/identity headers and supplies a trusted application audience; API ingress accepts these headers only from its configured proxy. Next.js rendering, route handlers and server actions call the API; they do not read PostgreSQL or implement alternative state transitions. Server-to-server calls preserve the validated actor/audience and trace context without inventing roles. Raw browser cookies are never copied to arbitrary outbound hosts.

Controllers validate input and invoke an owning application port. Every domain owns its repositories, mutations, invariants and response projections. A coordinator may compose declared local ports in one transaction for an atomic business invariant. Domain services, workers and internal callers apply the same policies as HTTP; there is no privileged internal shortcut. Provider SDK models, ORM records, encrypted credentials and raw events never become response types.

`packages/contracts` owns versioned request/response schemas and generated clients. Phase 1 establishes schema tooling; each feature phase adds OpenAPI and contract fixtures before exposing its routes. `/v1` is the major public contract. Breaking field, enum, error, policy or semantics changes require a reviewed migration/version strategy; optional additive fields still undergo disclosure review. Unknown request fields are rejected. Clients handle unknown response enum values as unsupported/read-only, never as success. Deprecation includes a consumer inventory, migration window and telemetry before removal.

## Complete logical root catalog

All paths below are relative to `/api/v1`. A listed root is a domain boundary, not permission to activate future functionality. The [phase acceptance matrix](PHASE_ACCEPTANCE_MATRIX.md) controls enablement. Every master §52 root appears once; subdomains use the indicated owner rather than adding generic CRUD endpoints.

| Root | Owning port / representative operations | Response and authority boundary | First implementation phase |
|---|---|---|---|
| `/auth` | Identity; register, verify, login/logout, reset, MFA, sessions, step-up | Session/challenge-safe DTO; self only; no password/token hashes; staff audience separate | 2; SSO 14 |
| `/users` | Identity/User/Profile; own account/profile, public profile, privacy requests | PublicProfileDto distinct from SelfAccountDto; self changes; scoped case action for suspension/export handling | 2; privacy operations 13 |
| `/organizations` | Organization/Membership; create, invite/accept, members, roles, ownership transfer | Membership-scoped DTO; legal metadata and private members excluded from public organization projection | 2; enterprise 14 |
| `/verifications` | Verification; initiate, submit evidence, status, assigned review | Subject status/evidence references; public badges separate; analyst decisions on staff interface with exact case scope | 2 email; 3 ownership; 7 full |
| `/projects` | Projects and section ports; draft/revise/preview/submit; contextual intelligence | PublicProjectDto, OwnerProjectEditorDto and AuthorizedProjectDto are separate; immutable approved public revision; no direct status assignment | 3; intelligence 7 |
| `/marketplace` | Marketplace/Category/Recommendation; browse, categories, related listings | Approved PUBLIC cards/facets; read-time publication and eligibility; staff curation invokes owner port | 3 taxonomy; 4 discovery |
| `/search` | Search; structured filters, sort, cursor | Public-safe projection only; no hidden exact financials in ranking, facets, snippets or counts | 4; semantic gate 7 |
| `/watchlists` | Marketplace/Watchlist; collections, save/remove, notes/tags/share | Individual or explicitly shared workspace; saving does not confer listing access | 4; team 14 |
| `/saved-searches` | Search/SavedSearch; query, cadence, enable/delete | Owner-scoped query/preferences; alerts rerun current eligibility | 4 |
| `/deal-cart` | DealCart/Comparison; items, intended type, notes, collaborators, compare | Each comparison cell authorized; private notes not copied to counterparties; one independent deal per initiation | 5; team 14 |
| `/access-requests` | Access; request, information reply, partial approve/reject, revoke | Requester/owner inbox projections; exact categories/principal/deal/expiry; no implied NDA fulfillment | 6 |
| `/nda` | NDA; prepare/send, signer status, provider handoff, signed version | Named signer/deal scope; complete same-version proof from authenticated provider; no `signed: true` command | 8; required access fails closed in 6 |
| `/conversations` | Messaging; threads, messages, receipts, block/report, subscriptions | Active conversation/deal membership; attachments independently authorized; message text cannot accept an offer | 6; protected attachments 8 |
| `/deals` | Deals and LOI port; inquiry, participants, named commands, timeline, LOI | Exact represented-party mandate and stage; timeline sanitized; no arbitrary target-state endpoint | 6 kernel; 9 engine |
| `/offers` | Offers/Counteroffer; draft, submit, counter, accept/reject, withdraw | Immutable revisions; exact current revision, recipient side, authority, deadline and version | 9 |
| `/diligence` | Diligence; plans, tasks, submissions, review, waiver, completion | Task/category scope; separate submitter/reviewer; mandatory blockers prevent completion | 10 |
| `/data-rooms` | DataRoom; room/folder/group management and permitted tree | Deal-scoped hierarchy; no foreign folder counts; group membership never bypasses document policy | 8 |
| `/documents` | Documents/Policy; upload intent/finalize, version metadata, view/download/export, archive | Clean immutable versions; typed purpose and category; explicit action grants, NDA/expiry, audit-before-capability | 3 media kernel; 7 evidence; 8 VDR |
| `/agreements` | Agreements; draft/version/send, signing status, provider handoff | Same-version authorized signers; source document read also authorized; changes supersede old signing package | 11 sandbox |
| `/settlements` | Settlement/Escrow; create, hosted onboarding/funding, status, release/refund/cancel requests, webhook ingress | Authorized financial participants; safe provider references, exact Money, durable operation, independent confirmation | 11–12 sandbox; live 15 |
| `/transfers` | AssetTransfer; checklist, evidence, recipient confirmation, inspection | Assigned submitter and intended recipient; no plaintext handover credentials; final acceptance distinct from checklist submission | 12 sandbox |
| `/portfolio` | Portfolio; retained rights, metrics/notes, authorized export | Holder/team scope and completed provenance; no renewed document/source access | 12; enterprise 14 |
| `/reviews` | Reputation/Review; eligible submit/edit/report, public review | Completed relationship; unique author/target/deal; sanitized publication and immutable revision history | 12 |
| `/reputation` | Reputation; safe score components/confidence | Approved aggregate signals; no raw KYC, private disputes or purchased verification | 12 |
| `/billing` | Billing/Subscriptions; plans, subscriptions, invoices, hosted method changes | Billing mandate; provider receipts authoritative; billing distinct from deal settlement and confidential grants | 14 |
| `/notifications` | Notifications; inbox/read state, preferences | Recipient only; minimal template parameters; link target freshly authorized; mandatory alerts preserved | 2, extended per phase |
| `/analytics` | Analytics; allowlisted event intake, permitted aggregate reports | Consent/purpose and owner scope; suppress small cohorts; never a financial/audit source of truth | 4; operations 13; enterprise 14 |
| `/compliance` | Compliance/Risk; own requirements, assigned cases, hold/review | Customer-safe requirement DTO separate from staff evidence; no default case discovery; reviewed deterministic unlock | 2 policy kernel; 11 finance; 13 console |
| `/admin` | AdminFacade; moderation/support queues, flags, configuration, audit | Separate staff session/MFA/case/purpose; invokes domain commands, no database editor or user impersonation | 3 reviewer; 7 analyst; 11 operations; 13 console |

Repository and AI operations are contextual children of `/projects`, `/deal-cart` or `/deals`; their jobs do not gain transactional rights. Feature flags and audit exports use scoped `/admin` commands. Provider callbacks have dedicated explicitly configured routes under the owning root; they never share a generic “set status” route.

## Sessions, CSRF and origins

Opaque random session tokens are transmitted only in Secure, HttpOnly, host-only cookies: `__Host-dealith_session` on the customer origin and `__Host-dealith_admin_session` on the staff origin, `Path=/`, no `Domain`, `SameSite=Lax`. Only a token digest resides in PostgreSQL; the browser stores neither bearer credentials in localStorage nor server roles as authority. Server records bind user, audience, expiry, security version and authentication assurance. A customer session is rejected on the staff audience even if the same user has staff rights.

For browser mutations including login/logout, enforce an exact configured Origin (validated Referer fallback only when Origin is absent) and a per-session synchronizer CSRF token in `X-CSRF-Token`; reject missing/null/untrusted origin. Pre-authentication login/register/reset flows use a short-lived origin-bound pre-session challenge, replaced on login. `/auth/csrf` issues the token through a no-store same-origin response. Tokens never appear in URLs/logs. Check Fetch Metadata where supported as another signal; absence does not bypass Origin/token checks. No GET/HEAD endpoint performs a business mutation. SameSite cookies are an additional control; they do not replace CSRF validation. [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

CORS is disabled for ordinary cross-origin browser access; any approved origin is enumerated per environment with exact scheme/host/port. Never reflect arbitrary origins or combine wildcard origins with credentials. Redirect targets use local allowlisted paths, not unvalidated URLs. E-signature/payment return pages display a pending state and query the API; they cannot finalize signatures or funds. Future SSO callbacks use their dedicated protocol validation and one-time state/nonce, with implementation reviewed in Phase 14. Authenticated signed provider webhooks and narrowly authenticated service calls use their own ingress policy; the CSRF exception is route-specific, not a blanket exemption for API calls.

Session expiry/rotation/recovery and five-minute sensitive-action step-up follow [SECURITY_MODEL.md](SECURITY_MODEL.md). Realtime handshakes verify Origin, session and audience; every channel subscription and message checks current participant scope. Revocation closes subscriptions and prevents new delivery even when a queued notification contains a formerly valid resource reference.

## Input, DTO and disclosure contract

Validate route IDs, query strings, content type, unknown properties, enum values, field lengths, nesting depth, collection size and business semantics before a command runs. Reject mass assignment of owner, roles, verification outcome, provider status, balances and lifecycle status. An owner/organization ID selects a candidate resource; server-resolved membership/mandate supplies authority. JSON requests default to a 1 MiB ceiling and bounded decompression; specialized webhooks and upload intents declare smaller or separately justified limits. Files use the constrained storage upload flow rather than arbitrary multipart bodies on every API root.

`Money = { amount: decimalString, currency: supportedCurrency }`; adapters validate currency precision/range exactly and never accept floating-point or implicit FX. Times are UTC ISO 8601 instants; display timezone is a client concern. IDs are opaque strings. Published content, terms, agreements, document bytes and acceptance evidence carry immutable version/hash references. Absent evidence is unknown, never zero revenue or verified success.

Policy builds an allowlisted output DTO before serialization, including nested joins, collection totals, relationship links, download names and derived scores. Forbidden properties are absent. Public approximations are separate approved fields, not client-rounded private values. Eight classes in [RBAC/ABAC](RBAC_ABAC_MATRIX.md) are independent predicates, not a clearance ladder. PLATFORM_ONLY evidence is available only through purpose-scoped staff DTOs; a generic admin role cannot request all fields.

All confidential responses, errors associated with private resources, exports and authenticated rendered payloads use `Cache-Control: private, no-store`. No private data enters shared CDN, SEO metadata, RSC/hydration payloads for unauthorized viewers, public search or browser analytics. Clear per-user query caches on logout/account/organization switch. A client field-selection parameter may narrow an allowed DTO, never widen it. Public cache keys and validators refer only to public revision/eligibility; validators must not expose private draft changes.

## Queries and pagination

Collection requests use `limit` (default 25, maximum 100), `cursor` and allowlisted filter/sort fields. Cursors are opaque integrity-protected values bound to route, filter digest, order, public projection generation or authorized principal/scope and expiry. Reject tampering, route/scope reuse and expired generations with `INVALID_CURSOR`; clients restart the query. A cursor never serves as authorization.

Order by a stable tuple such as `(createdAt, id)`; search adds ranking-generation identity plus stable tie-breaker. Return `{ data: [...], page: { nextCursor, hasMore }, meta: { requestId } }`. Do not return an unfiltered total. If a count is supplied, compute it within the same visibility scope; privacy-sensitive reporting may omit or suppress it. Each page rechecks present eligibility; revocation can remove items between pages. A normal browsing cursor is not a consistent historical export. Exports pin an allowed manifest and reauthorize every item again before release.

Filter ASTs support documented operators and bounded complexity; no raw SQL, repository query language or unrestricted regular expressions. Search indexes contain public fields only. Private queries run through the owning policy-scoped port. If freshness or a required policy check is unavailable, omit/deny protected results with a safe availability response instead of returning stale confidential data.

## Commands, idempotency and concurrency

Named POST commands express intent, for example `/offers/{id}/accept`, `/projects/{id}/submit` and `/settlements/{id}/release-requests`. Request schemas bind exact revision and `expectedVersion`; no route accepts an arbitrary target status. Ordinary draft PATCH edits may use the same version field. Missing required version is `428 PRECONDITION_REQUIRED`; an obsolete version is `409 VERSION_CONFLICT`. Client timestamps never determine race winners.

Require `Idempotency-Key` for resource creation with external effects, access/deal initiation, invitation acceptance, legal commands, offer decisions, membership/privilege changes, transfer confirmation, provider intents and all money commands. Scope identity by authenticated actor/represented principal, audience, canonical operation and resource scope. Validate key format/length; store a digest of canonical validated input, including expected version and relevant immutable terms. Uniqueness is enforced in PostgreSQL; matching keys with different inputs yield `409 IDEMPOTENCY_CONFLICT`.

An exact retry first authenticates and checks present permission to the stored result. It returns the same operation/resource reference and safe result without rerunning side effects; lost authorization denies replay disclosure. A concurrent in-progress retry returns its existing `202` operation reference. The winning transaction stores the intent/result, authoritative audit and outbox atomically with its mutation. Validation/authentication failure before an intent is accepted is not recorded as a successful command. Retention is operation-specific: ordinary keys have a documented bounded replay window; financial/legal command identities remain through their operation, reconciliation and record-retention period. Expiring a cache never permits a second release.

Settlement retries reuse the durable ProviderOperation's provider/account/environment key even after HTTP-key response retention expires. External timeouts produce pending/unknown operations; the caller queries the operation resource under the owning root and may retry the same command key. It must not generate a fresh key to “try again” after ambiguous execution. [SETTLEMENT_ARCHITECTURE.md](SETTLEMENT_ARCHITECTURE.md) defines reconciliation and safe retry boundaries.

Check current permissions, mutable grants/holds, expected version and state guards inside the committing transaction. Lock affected aggregate/reservation rows in a documented deterministic order; unique constraints provide final exclusion. A multi-aggregate offer acceptance coordinates Offers, Deals and the project reservation through owned ports. Retry database serialization failures only with the same command identity and fresh guard evaluation. No provider network call runs inside a database transaction. A delayed worker repeats the authorization/hold checks applicable to execution and never interprets an old event as a new approval.

## Results, errors and asynchronous work

Single reads return `{ data, meta: { requestId } }`. A created resource returns `201` and its authorized `Location`; completed commands return `200` with the committed version/result. Provider/scan/AI/export work returns `202` with `{ operationId, status: "pending", statusUrl }` inside `data`; operation status URLs remain scoped. `202` does not mean signed, scanned clean, funded, transferred or released.

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "This offer changed. Reload it before continuing.",
    "requestId": "opaque-server-request-id",
    "fieldErrors": [],
    "retryable": false
  }
}
```

| HTTP status | Stable code family | Required behavior |
|---|---|---|
| 400 | INVALID_REQUEST, INVALID_CURSOR, CSRF_INVALID | Safe bounded validation details; no raw submitted secrets |
| 401 | AUTHENTICATION_REQUIRED, SESSION_EXPIRED | Reauthenticate; clear invalid cookie; do not expose whether another account exists |
| 403 | FORBIDDEN, STEP_UP_REQUIRED, CAPABILITY_DISABLED | Only after permitted resource discovery; safe obligation, no hidden policy evidence |
| 404 | NOT_FOUND | Unknown and concealed resources use the same response shape; no foreign tenant names |
| 409 | VERSION_CONFLICT, IDEMPOTENCY_CONFLICT, STATE_CONFLICT | Refresh/review or correct key use; never silently accept changed terms |
| 413 / 415 | PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | Reject before expensive work or trusted parsing |
| 422 | VALIDATION_FAILED, UNSUPPORTED_CAPABILITY | Authorized request is structurally valid but violates a business/capability rule |
| 428 | PRECONDITION_REQUIRED | Required version/revision binding absent |
| 429 | RATE_LIMITED | Bounded Retry-After; no detailed anti-abuse threshold disclosure |
| 500 / 503 | INTERNAL_ERROR / TEMPORARILY_UNAVAILABLE | Safe request ID; retry guidance; no raw database, paths, provider response or stack trace |

Generate request IDs server-side; validate external trace context separately. Field errors identify permitted input fields only. Error responses obey the same disclosure and cache rules as successful responses. Generic login/reset/registration acknowledgments avoid account enumeration, with timing and rate-limit behavior reviewed together. Log restricted diagnostic references, never full request/response bodies by default.

Provider callbacks validate raw signatures/account/environment and persist the inbox before success. Duplicate exact callbacks acknowledge without repeated effects; conflicting digest, wrong environment or unknown linkage is quarantined/rejected according to the adapter contract. Reconciliation is a protected operation, not an endpoint that trusts a client financial claim.

## Verification gates

Phase 1 establishes contract generation, safe errors, ingress limits and cross-package boundaries. Phase 2 proves audience/session/CSRF isolation, mass-assignment rejection, tenant context and negative authorization. Each feature phase adds both allowed and forbidden API paths, hidden nested-field and cursor reuse cases, concurrent commands, exact/different-key retries and asynchronous unknown outcomes. Phase 11–12 additionally prove provider fault/replay/concurrency scenarios; Phase 15 requires external security review and production configuration evidence. Documentation coverage is not evidence that these runtime checks passed.
