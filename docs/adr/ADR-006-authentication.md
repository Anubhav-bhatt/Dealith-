# ADR-006: Opaque server sessions with separate audiences

Status: Recorded baseline, 2026-09-07. Sources: master §§12–14, 44, 46, 82, 93. Implementation begins PHASE-02.

## Context and decision

Identity owns email/password registration, verification, secure login/recovery, MFA and session listing/revocation. Use high-entropy opaque session identifiers in Secure HttpOnly host-only cookies. PostgreSQL stores hashed identifiers and authoritative session metadata, audience, assurance, expiry and revocation; Redis is optional acceleration and cannot make an unavailable/unknown session valid. Hash passwords with a reviewed memory-hard implementation and calibrated parameters at implementation time; no hand-built cryptography.

Marketplace and administration have separate origins, host-only cookie names and explicit **web/admin audiences**. Each origin proxies its `/api/v1` path to NestJS; audience is checked server-side against the intended route, not accepted from request body. A web session never authenticates an admin action. Require staff MFA and fresh step-up for sensitive account, ownership and settlement operations under current policy. Staff assignment and ABAC still apply after authentication. Cross-origin staff impersonation is not a baseline support feature.

Rotate session identity at login, privilege/assurance change and recovery; revoke on logout, explicit revocation and relevant account compromise. Enforce idle and absolute expiry through server configuration, with stricter staff limits defined and tested in PHASE-02. Do not invent current operating timeout measurements in this record. Password-reset and email-verification challenges are purpose-bound, expiring, single-use and stored hashed; generic responses and rate limits reduce enumeration. MFA recovery has independently auditable safeguards and cannot use an unverified email change as proof.

State-changing browser requests require same-origin validation and CSRF protection; SameSite cookies are an additional control. Reject unexpected origins/content types and constrain CORS. No session token in browser local storage, URL, logs or analytics. Private SSR/RSC/API responses bypass shared caches. Enterprise federation is optional PHASE-14 and maps verified provider identity to these same local session, membership and authorization controls; it does not grant a global organization role.

## Alternatives and consequences

Long-lived browser JWTs make immediate revocation and entitlement changes harder to guarantee. One cookie shared across subdomains weakens audience separation. A managed identity adapter may later handle primary authentication if it meets recovery, residency and federation requirements, but it must preserve the local audience/assurance and revocation contract. Server sessions cost an authoritative lookup and availability dependency; if current status cannot be established, access fails closed.

## Verification and revisit

PHASE-02 tests registration/reset/replay/enumeration, CSRF/session fixation, session rotation/expiry/revocation, MFA recovery, customer-to-admin rejection, organization removal and cross-tenant reads. Evidence includes response fields/cookies, server state and audit outcomes, not only redirects. PHASE-14 adds SSO issuer/audience and organization binding tests. See [security model](../SECURITY_MODEL.md), [authorization](../RBAC_ABAC_MATRIX.md) and [E2E matrix](../E2E_TEST_MATRIX.md).
