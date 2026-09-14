# Security model

Status: Phase 0 design baseline, 2026-09-07; controls below require implementation evidence. Authority: master §§12, 23–29, 44–47, 68, 75–77 and 82. [RBAC/ABAC](RBAC_ABAC_MATRIX.md) defines resource policy; [threat model](THREAT_MODEL.md) defines abuse cases; [test strategy](TEST_STRATEGY.md) defines verification.

## Trust boundaries and identity

Treat browser input, seller content, provider callbacks, queue payloads and model output as untrusted. TLS terminates at the controlled ingress; ingress strips client identity/forwarding headers and passes only authenticated proxy context. Public web, staff web, API, workers, private storage and provider adapters have separate capabilities. Browser code and Next.js rendering never own persistence or financial authority.

Identity stores opaque session tokens hashed in PostgreSQL. Cookies are Secure, HttpOnly, host-only and audience-bound; web sessions cannot authenticate administration. Rotate sessions after authentication, recovery and privilege change; enforce absolute and idle expiry, revocation and security-version checks. Passwords use a reviewed adaptive password hash with benchmarked parameters. Verification/reset/recovery challenges are short-lived, purpose-bound and single-use with bounded attempts. Login/reset responses resist account enumeration; throttle by account and safe network/device signals without enabling permanent denial by an attacker.

State-changing cookie-authenticated requests require session-bound CSRF proof and strict allowed Origin checks. SameSite cookies supplement these checks. MFA is mandatory for staff and high-risk changes; sensitive customer commands require step-up within five minutes, matching the authorization matrix. Recovery cannot silently bypass equivalent assurance or existing risk holds. Phase 2 must test recovery, replay, session fixation, logout/revocation and independent staff/customer audiences. [ADR-006](adr/ADR-006-authentication.md) fixes the session boundary.

## Authorization and data protection

The owning application service checks current identity, membership, represented party, resource scope, action, classification, NDA, grant, jurisdiction, risk, policy version and capability before reads or writes. Policies default deny. Queries apply scope before pagination/counting and serialize explicit DTOs. Platform roles require assigned purpose/case for confidential access; organization administrators do not inherit every deal's rights. Permission checks apply equally to HTTP, worker, websocket, export and AI paths.

PostgreSQL RLS adds protection to scoped tables; migrations and runtime use separate roles. Runtime roles must not own protected tables or have superuser/BYPASSRLS privileges. Where an owner role must access data, explicitly evaluate FORCE ROW LEVEL SECURITY and test it. Pool context is transaction-local. PostgreSQL documents owner and privileged-role bypass behavior; enabling RLS alone is insufficient. [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

Data classes and exceptions follow the authorization matrix. Encrypt storage with environment-specific keys and TLS in transit. Restrict KYC, repository tokens, signed legal evidence and audit archives independently. Secrets come from managed stores and workload identity, with rotation and least privilege. Public configuration is an explicit allowlist; never put provider credentials in frontend builds, diagnostics or caches. Retention and legal holds are separate from access permission and follow [compliance boundaries](COMPLIANCE_BOUNDARIES.md).

## Control contracts

| Surface | Required preventive and detective controls | First gate / evidence |
|---|---|---|
| API | Bounded schemas, parameterized queries, safe errors/request IDs, rate/quota limits, cursor scope, idempotency and expected aggregate version | Phase 1 harness, Phase 2 protected API; malformed input and cross-principal tests |
| Rendering | Context-safe encoding, sanitized rich content, restrictive CSP and frame policy, no active seller HTML on app origin, private responses no-store | Phase 3; stored/reflected content tests and payload inspection |
| Files | Private quarantine, exact immutable version, MIME/size/archive bounds, isolated scanning/rendering, clean-only delivery, purpose-scoped policy | Phase 3 media; Phase 8 full [VDR](DATA_ROOM_SECURITY_MODEL.md) tests |
| Fetch/integration | Approved outbound hosts, HTTPS, redirect and resolved-address checks, private/link-local/metadata denial, bounded response/time, no ambient credentials | Phase 3 preview and Phase 7 repository; SSRF fixtures |
| Jobs | Durable intent, explicit service principal and resource scope, current policy on execution/delivery, bounded retry and dead-letter handling | Phase 1 harness, each feature; revoke while queued and replay cases |
| Financial actions | Exact decimal amount, authorized destination version, independent approvals where required, signed durable inbox, unique effects and reconciliation | Phase 11–12 sandbox; [settlement](SETTLEMENT_ARCHITECTURE.md) suite |
| Administration | Separate audience/MFA, least privilege, assigned case, reason/ticket, no direct table editing, no self-approval of overrides | Phase 3 reviewer kernel, Phase 13 console; staff negative tests |
| Supply chain | Lockfile, dependency/secret/license scans, restricted CI trust, immutable build provenance, scoped OIDC deployment | Phase 1; [CI/CD](CI_CD.md) evidence |
| Audit | Atomic state/audit/outbox, append-only application privileges, protected archive, scoped exports, continuity/recovery checks | Phase 1 storage harness, Phase 2 protected commands, Phase 15 restore proof |

Private HTML, RSC payloads, metadata, search facets, errors, metrics and traces must omit confidential fields. Revocation invalidates subsequent reads and queued outputs. Already delivered bytes cannot be recalled; signed URL residual access is bounded by the [VDR delivery contract](DATA_ROOM_SECURITY_MODEL.md), not described as instant deletion.

## Incidents and assurance

Break-glass access requires an incident, named approver, narrow temporary scope, fresh assurance, reason, immutable audit and post-incident review. It cannot bypass provider confirmation, create custody or erase evidence. Compromise response preserves evidence, revokes affected sessions/grants/credentials, restricts mutations, reconciles outstanding operations and uses [runbooks](RUNBOOKS.md) before reopening.

Use version-pinned OWASP ASVS control identifiers when Phase 1 creates the test mapping; target Level 2 across the application and assess higher-assurance controls for staff, documents and finance. This is a verification plan, not ASVS certification. The project provides versioned requirements for testing application controls. [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)

Phase 15 requires independent penetration testing, closure of critical findings, tested recovery, provider/jurisdiction readiness and authorized release evidence. Ordinary scan success never substitutes for authorization, state-machine or monetary invariant tests.
