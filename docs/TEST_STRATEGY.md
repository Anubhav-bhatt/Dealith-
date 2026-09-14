# Test strategy

Status: Phase 0 architecture with the Phase 1 runner amendment in [ADR-017](adr/ADR-017-local-foundation.md). Actual results are recorded in the [Phase 1 report](phases/PHASE_01_REPORT.md). Source: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md), sections 63–70. Scenario inventory: [E2E test matrix](E2E_TEST_MATRIX.md). Gates: [CI/CD](CI_CD.md), [phase acceptance](PHASE_ACCEPTANCE_MATRIX.md), [Definition of Done](DEFINITION_OF_DONE.md).

## Test layers and ownership

| Layer | Tool / environment target | Required evidence and scope | Accountable owner / first phase |
|---|---|---|---|
| Static | Formatter, ESLint, TypeScript; architecture import checks; secret/dependency scanning | No circular domain dependencies, frontend persistence imports, leaked secrets or unchecked contract drift; lockfile and licenses reviewed | Platform / 1 |
| Unit | Vitest for browser/shared packages and NestJS (ADR-017) | Deterministic policies, all allowed and denied transitions, monetary precision, rounding, revisions, idempotency, provider status normalization, entitlements | Domain engineer / 1 onward |
| Component | React Testing Library + Vitest | Keyboard, forms, focus, role-aware affordances, loading/empty/error/denied/expired/offline states; accessible names and financial confirmation | Frontend / 1 onward |
| Integration | Vitest, isolated native PostgreSQL + Redis or dedicated CI service containers (ADR-017); future S3 emulator plus AWS sandbox parity tests | Real transactions, ownership predicates, unique constraints, CAS races, migrations, outbox, workers, policy expiry, malware quarantine; emulator limitations explicit | Backend / 1 onward |
| Contract | OpenAPI response/request validation; Pact for contracts controlled by Dealith; recorded/synthetic provider fixtures | Web/admin contract compatibility; additive events; adapter normalization and version compatibility. Third-party provider behavior verified in its sandbox; no claim of third-party Pact certification | API + integrations / 1, providers 7–11 |
| API E2E | Supertest against assembled NestJS app and real ephemeral backing services | Full authenticated command/query paths, explicit denial, payload field absence, transaction and audit effects | Backend QA / 2 onward |
| Browser E2E | Playwright Chromium, Firefox, WebKit; mobile viewports | Real web/admin → API workflows with role/tenant fixtures, no privileged browser shortcuts; screenshot/trace on failure with secrets redacted | Product QA / 2 onward |
| Security | SAST, dependency/IaC/container scans, authenticated DAST in owned test environment, manual adversarial review | ASVS control-to-test mapping, IDOR/BOLA, CSRF, XSS, SQLi, SSRF, upload, session, privilege, signed link and settlement abuse | Security / 1 onward |
| Performance | k6 + browser Web Vitals in pre-production | Workload, commit, topology, dataset and percentiles retained; objectives and measurement points in [observability](OBSERVABILITY.md) | SRE + QA / baseline 1, critical 15 |
| Resilience | Fault injection into isolated staging/pre-production | DB failover, Redis loss, provider timeouts, worker crash, duplicate/out-of-order events, replay, restore and reconcile; invariant checks after recovery | SRE + domains / 1 onward, full 15 |
| Provider sandbox | Adapter harness + provider sandbox evidence | Signature verification, participants, settlement create/fund/release/refund, agreement callbacks, throttling, unknown outcomes, reconciliation; no real funds | Integrations / 7–12 |
| Manual exploratory | Scoped charters + issue/evidence capture | Ambiguous permissions, complex diligence, recovery, mobile, accessible documents, confusing financial UX and fraud paths | QA + domain specialist / each feature phase |
| UAT | Staging/pre-production synthetic personas | Founder, buyer, legal, operations and organization-admin acceptance; legal/compliance readiness evidence before launch | Product + domain owners / phase exit, full 15 |
| Production smoke | Read-only synthetic public/health queries; dedicated synthetic account for narrowly scoped session checks | Route and dependency health without documents, provider funding, deals, messages or external communication side effects | SRE / 15 after release |

## Test architecture

`packages/test-kit` will own builders, synthetic personas, clock controls, fixtures, policy assertions and provider fakes; it must never be imported by production packages. Each scenario declares actor, tenant, grant, NDA, jurisdiction, listing/deal state, feature flags, provider mode and expected state. Contract fixtures contain synthetic data only. Tests cannot use production documents, source code, KYC, tokens or provider credentials.

Backend integration tests use the supported PostgreSQL and Redis versions selected and pinned in Phase 1; SQLite is not a substitute for concurrency, SQL or monetary correctness. Infrastructure emulators validate local flow, while controlled AWS sandbox tests validate KMS, IAM, signed access and object behavior. Each parallel test run has a unique database/namespace/object prefix. Cleanup removes only its tagged resources. No `sleep`-based ordering assertions: control clocks, await persisted conditions with bounded deadlines, and inject provider events deterministically.

Browser tests use the actual authentication path for dedicated auth cases. Other cases may provision synthetic accounts through a test-only setup utility outside production builds, then authenticate normally or restore a previously authenticated test session. Cross-user/organization tests use distinct browser contexts and verify HTTP payloads, caches and object bytes, not only hidden buttons. A 403/404 denial is insufficient if a successful response contains a confidential field.

## Critical invariants

1. Every state mutation passes the [project](PROJECT_STATE_MACHINE.md) or [deal](DEAL_STATE_MACHINE.md) transition service; tests enumerate all declared edges and reject every other pair. Version races result in one winner and no double event/offer acceptance. Clock and actor predicates are separate assertions.
2. Security-policy tests vary membership, role, purpose, owner approval, NDA validity, document classification, deal participation, jurisdiction, policy version, session revocation and admin assignment. Negative fixtures must include two organizations and users with similar roles but unrelated resources.
3. State change, audit requirement and outbox write commit atomically or roll back. Consumers and provider mutations are idempotent under replay and crashes before/after acknowledgment. Duplicate financial effects and lost committed audit events have zero tolerance; latency/error budgets do not excuse either.
4. Offer revisions, signed agreement versions, settlement evidence and transfer evidence retain immutable history. Money uses decimal arithmetic and currency/precision metadata; cross-currency totals require explicit conversion data.
5. A funded, disputed or outcome-unknown settlement cannot be casually cancelled or released. Only confirmed provider facts and deterministic policy move financial state. Browser redirect, AI output and email do not establish payment success.
6. Revocation affects subsequent protected reads, queued work, AI retrieval and permission caches; signed-object residual access behavior must match the documented bounded lifetime. No-download access tests request the raw original directly and require denial.
7. Private API payloads, RSC output, HTML, metadata, search indexes, metrics labels, CDN caches, error bodies and traces cannot leak protected fields. Publication and suspension test cache/index purge failure as well as the successful path.

## Coverage and failure policy

Critical authorization, transition, financial/idempotency and audit logic requires complete declared transition/policy case coverage and near-complete meaningful branch coverage; each intentionally unexercised branch requires a reviewed reason. Do not equate a raw percentage with correctness. Lower-risk code uses risk-based behavior coverage. A failing critical scenario blocks the phase/release. Quarantining a flaky critical test does not waive its acceptance requirement; repair or reproduce with an independently reviewed test before proceeding. Retry may collect diagnostics but cannot turn a repeatable failure into a pass.

Each test reports scenario ID, requirement/master alias, commit SHA, environment, dataset seed, assertion evidence, owner, timestamps and result. Store failure traces/screenshots only after redacting PII, cookies, signed links and document contents. Restrict artifact access; baseline retention is 30 days for routine CI diagnostics, with controlled retention extension for incidents/legal holds according to the security policy. Phase exit evidence is linked from the phase report.

## Phase sequencing

Phase 0 checks documents, catalogs and consistency only. Phase 1 establishes runners, minimal harnesses, dependency boundaries and CI. Phase 2 establishes identity/tenant negative coverage; Phase 3 adds publication/moderation kernels; Phase 6 introduces a minimal Deal aggregate for access/conversation context, without offers or money. Phase 7 enables verification/intelligence; Phase 8 enables NDA/VDR; Phase 9 expands formal deal and offer transitions. Phases 11–12 exercise provider sandbox settlement and transfer. Phase 13 expands administration/compliance rather than first introducing safety controls. Phase 15 requires independent penetration testing before real-money production settlement, recovery exercises, full UAT and launch gates.

## Accessibility and performance acceptance

Automated checks complement manual keyboard/screen-reader review, accessible authentication, responsive reflow, financial review/correction and reduced motion. WCAG 2.2 AA applies to complete user processes, including third-party signing/funding handoffs where applicable; provider selection must evaluate accessibility. The standard contains testable success criteria and complete-process conformance requirements; an automated scan alone does not establish conformance. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

The initial benchmark and SLO definitions are in [observability](OBSERVABILITY.md); measurements are future evidence, not Phase 0 results. k6 covers browse/search/detail/login/deal-room/messages/data-room/webhook bursts and worker drain. Sustained and burst runs verify business invariants and queue backlogs alongside response percentiles. Run recovery drills quarterly after launch, after material topology changes and before enabling settlement following a restore.
