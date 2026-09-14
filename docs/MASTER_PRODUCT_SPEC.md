# Master product specification and scope traceability

Status: Phase 0 baseline, 2026-09-07. The [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md) §§0–103 remains authoritative and unchanged. This document organizes its implementation contract rather than replacing it. [Domain map](PRODUCT_DOMAIN_MAP.md) contains all 51 domain responsibilities and delivery phases; [ADRs](adr/README.md) record explicit interpretations.

## Product outcome and journeys

A verified owner publishes a credible technology asset; an eligible buyer discovers it, compares evidence, requests confidential access, signs the required NDA, discusses and negotiates structured terms, completes diligence, signs, funds provider-managed escrow, receives and inspects the agreed assets, releases and closes with durable rights/audit evidence. These are distinct authorized steps, not a generic checkout. A planned domain or investor intent does not enable regulated execution.

| Journey | Entry and successful outcome | Required failure/permission behavior |
|---|---|---|
| Founder publishes | Verified-email owner → draft 15-step wizard → ownership/evidence review → approved public revision | Missing/false evidence blocks; live pending edits stay private; separate reviewer |
| Buyer evaluates | Public browse/search → watchlist/Deal Cart → compare 2–5 → choose one opportunity | Each field independently authorized; private notes isolated; no cart-wide funds |
| Parties disclose | Deal/participants → purpose/category request → owner decision → exact-scope NDA → controlled room | Rejection/partial approval/expiry/revocation explicit; conversation alone does not grant evidence |
| Parties negotiate | Structured offer → immutable counter revision → exact acceptance/rights reservation → LOI | Expired/stale/conflicting acceptance denied; chat/AI cannot create assent |
| Parties execute | Reviewed diligence → exact agreement/signers → sandbox escrow funding → transfer/inspection → release/close | Unknown provider outcome pending; disputes/holds preserve money and rights; required evidence cannot be bypassed |
| Rights holder retains | Completed Deal → PortfolioEntry/retained evidence → permitted tracking/review | License and acquisition dispositions differ; portfolio does not resurrect document grants |
| Staff operates | Separate MFA staff session → assigned case/review → authorized domain action with reason | No global private-data bypass, self-approved override or manual money-state edit |
| Enterprise subscribes | Authorized billing/team administrator → plan/entitlements/SSO/scouting | Billing authority distinct from deal participation; purchased plan grants no regulatory or confidential permission |

## Feature boundary matrix

| Feature family | First delivery | Scope and acceptance boundary |
|---|---|---|
| Platform/configuration/CI/telemetry/design primitives | 1 | Small deployable baseline and actual verification harnesses |
| Identity/organizations/role and audit kernels | 2 | Current-session/tenant negative evidence before protected features |
| Structured publishing and safe previews | 3 | Ownership/reviewer/file-safety kernels included; no seller code execution |
| Discovery/watchlists/alerts | 4 | Approved public projections; privacy-safe indexing and analytics |
| Deal Cart/comparison | 5 | Deterministic, 2–5 listings, independent deals |
| Access/communication/Deal kernel | 6 | Scope/expiry/revocation; NDA-required material locked until 8 |
| Verification/repository/AI | 7 | Evidence-linked advisory signals; explicit read permissions, no autonomous decisions |
| NDA/data room | 8 | Exact-version signatures, clean private bytes, per-action grants and audit |
| Offers/LOI/full Deal engine | 9 | Immutable terms and tested allowed/denied transitions/rights races |
| Diligence | 10 | Versioned templates, reviewers, evidence and mandatory blockers |
| Agreements/settlement | 11 | Provider ports, authenticated inbox, durable operations/reconciliation; sandbox |
| Transfer/inspection/completion | 12 | Recipient proof, final liabilities, rights-aware portfolio; sandbox |
| Full admin/compliance/risk | 13 | Extends early safety kernels; scoped operational casework |
| Billing/enterprise | 14 | Separate subscription money, server entitlements and tenant/team boundaries |
| Launch assurance | 15 | Measured security/performance/recovery and scoped legal/provider readiness |

Initial execution covers supported commercial acquisition, source/IP purchase and licensing with positive fiat/full provider escrow. Partnership/revenue-share and other structures remain represented but disabled until their complete policy exists. Regulated investments and crypto default off. Native custody/keys/token/exchange, arbitrary hosted seller execution, public raw source, autonomous AI transactions and native mobile are excluded from initial implementation. [Compliance boundaries](COMPLIANCE_BOUNDARIES.md) and [ADR-016](adr/ADR-016-scope-clarifications.md) define activation/change rules.

## Master section traceability

Each row retains one source section and its primary implementing specification. Supporting links within that document complete the dependency chain; the table establishes coverage, not implemented acceptance. The preserved scope remains the detail authority. MVP §95's 28 criteria are enforced through the phase matrix, E2E/security/performance/recovery gates and Phase 15 release evidence.

| Requirement ID | Master section | Requirement / source heading | Primary specification | Owner | First relevant gate |
|---|---|---|---|---|---|
| SCOPE-000 | §0 | Document Purpose | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-001 | §1 | Executive Product Definition | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-002 | §2 | Product Vision | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-003 | §3 | Product Principles | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-004 | §4 | Target User Segments | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-005 | §5 | Asset Types | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-006 | §6 | Project / Business Stages | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-007 | §7 | Supported Deal Types | [COMPLIANCE_BOUNDARIES.md](COMPLIANCE_BOUNDARIES.md) | Product/Legal | 0; scoped enablement later |
| SCOPE-008 | §8 | Regulatory Product Separation | [COMPLIANCE_BOUNDARIES.md](COMPLIANCE_BOUNDARIES.md) | Product/Legal | 0; scoped enablement later |
| SCOPE-009 | §9 | Crypto Strategy | [COMPLIANCE_BOUNDARIES.md](COMPLIANCE_BOUNDARIES.md) | Product/Legal | 0; scoped enablement later |
| SCOPE-010 | §10 | Marketplace User Journey | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-011 | §11 | Public Website Information Architecture | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-012 | §12 | Authentication & Onboarding | [RBAC_ABAC_MATRIX.md](RBAC_ABAC_MATRIX.md) | Identity/Security | 2 |
| SCOPE-013 | §13 | User Profiles | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-014 | §14 | Organization & Team Management | [RBAC_ABAC_MATRIX.md](RBAC_ABAC_MATRIX.md) | Identity/Security | 2 |
| SCOPE-015 | §15 | Project Creation Wizard | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-016 | §16 | Listing Status Lifecycle | [PROJECT_STATE_MACHINE.md](PROJECT_STATE_MACHINE.md) | Projects | 3 |
| SCOPE-017 | §17 | Project Detail Page | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-018 | §18 | Marketplace Discovery | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-019 | §19 | Saved Search & Alerts | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-020 | §20 | Watchlist | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-021 | §21 | Deal Cart | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-022 | §22 | Project Comparison | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-023 | §23 | Access Requests | [DATA_ROOM_SECURITY_MODEL.md](DATA_ROOM_SECURITY_MODEL.md) | Access/Documents | 6/8 |
| SCOPE-024 | §24 | NDA Workflow | [DATA_ROOM_SECURITY_MODEL.md](DATA_ROOM_SECURITY_MODEL.md) | Access/Documents | 6/8 |
| SCOPE-025 | §25 | Messaging & Negotiation | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-026 | §26 | Virtual Data Room | [DATA_ROOM_SECURITY_MODEL.md](DATA_ROOM_SECURITY_MODEL.md) | Access/Documents | 6/8 |
| SCOPE-027 | §27 | Technical Intelligence | [REPOSITORY_INTEGRATION.md](REPOSITORY_INTEGRATION.md) | Intelligence | 7 |
| SCOPE-028 | §28 | Verification System | [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) | Verification/Intelligence | 3 kernel; 7 full |
| SCOPE-029 | §29 | Evidence Classification | [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) | Verification/Intelligence | 3 kernel; 7 full |
| SCOPE-030 | §30 | Project Potential Score | [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) | Verification/Intelligence | 3 kernel; 7 full |
| SCOPE-031 | §31 | AI Platform | [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md) | Verification/Intelligence | 3 kernel; 7 full |
| SCOPE-032 | §32 | Offer System | [OFFER_DILIGENCE_TRANSFER_MODEL.md](OFFER_DILIGENCE_TRANSFER_MODEL.md) | Deals | 9–12 |
| SCOPE-033 | §33 | Deal State Machine | [DEAL_STATE_MACHINE.md](DEAL_STATE_MACHINE.md) | Deals | 6 kernel; 9 full |
| SCOPE-034 | §34 | Due Diligence | [OFFER_DILIGENCE_TRANSFER_MODEL.md](OFFER_DILIGENCE_TRANSFER_MODEL.md) | Deals | 9–12 |
| SCOPE-035 | §35 | Agreements | [OFFER_DILIGENCE_TRANSFER_MODEL.md](OFFER_DILIGENCE_TRANSFER_MODEL.md) | Deals | 9–12 |
| SCOPE-036 | §36 | Settlement & Escrow | [SETTLEMENT_ARCHITECTURE.md](SETTLEMENT_ARCHITECTURE.md) | Settlement | 11–12 sandbox |
| SCOPE-037 | §37 | Asset Transfer | [OFFER_DILIGENCE_TRANSFER_MODEL.md](OFFER_DILIGENCE_TRANSFER_MODEL.md) | Deals | 9–12 |
| SCOPE-038 | §38 | Portfolio | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-039 | §39 | Reviews & Reputation | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-040 | §40 | Notifications | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-041 | §41 | Analytics | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-042 | §42 | Subscription & Monetization | [PRODUCT_DOMAIN_MAP.md](PRODUCT_DOMAIN_MAP.md) | Billing | 14 |
| SCOPE-043 | §43 | Admin Application | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-044 | §44 | RBAC + ABAC | [RBAC_ABAC_MATRIX.md](RBAC_ABAC_MATRIX.md) | Identity/Security | 2 |
| SCOPE-045 | §45 | Data Privacy | [COMPLIANCE_BOUNDARIES.md](COMPLIANCE_BOUNDARIES.md) | Product/Legal | 0; scoped enablement later |
| SCOPE-046 | §46 | Security Baseline | [SECURITY_MODEL.md](SECURITY_MODEL.md) | Security/domain owner | 1 onward |
| SCOPE-047 | §47 | Audit Architecture | [SECURITY_MODEL.md](SECURITY_MODEL.md) | Security/domain owner | 1 onward |
| SCOPE-048 | §48 | Technical Architecture | [MASTER_ARCHITECTURE.md](MASTER_ARCHITECTURE.md) | Architecture/Platform | 1 |
| SCOPE-049 | §49 | Recommended Technology Stack | [MASTER_ARCHITECTURE.md](MASTER_ARCHITECTURE.md) | Architecture/Platform | 1 |
| SCOPE-050 | §50 | Repository Structure | [MASTER_ARCHITECTURE.md](MASTER_ARCHITECTURE.md) | Architecture/Platform | 1 |
| SCOPE-051 | §51 | Core Data Model | [DATA_MODEL.md](DATA_MODEL.md) | Backend | 1 onward |
| SCOPE-052 | §52 | API Domain Boundaries | [API_BOUNDARIES.md](API_BOUNDARIES.md) | API | 1 onward |
| SCOPE-053 | §53 | Domain Events | [DOMAIN_EVENTS.md](DOMAIN_EVENTS.md) | Backend/Platform | 1 onward |
| SCOPE-054 | §54 | Transactional Outbox | [DOMAIN_EVENTS.md](DOMAIN_EVENTS.md) | Backend/Platform | 1 onward |
| SCOPE-055 | §55 | UI/UX Design System | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Frontend | 1 onward |
| SCOPE-056 | §56 | Responsive Requirements | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Frontend | 1 onward |
| SCOPE-057 | §57 | Accessibility | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Frontend | 1 onward |
| SCOPE-058 | §58 | Performance Requirements | [OBSERVABILITY.md](OBSERVABILITY.md) | SRE | 1 baseline; 15 proof |
| SCOPE-059 | §59 | Availability & Reliability | [OBSERVABILITY.md](OBSERVABILITY.md) | SRE | 1 baseline; 15 proof |
| SCOPE-060 | §60 | Observability | [OBSERVABILITY.md](OBSERVABILITY.md) | SRE | 1 baseline; 15 proof |
| SCOPE-061 | §61 | Logging | [OBSERVABILITY.md](OBSERVABILITY.md) | SRE | 1 baseline; 15 proof |
| SCOPE-062 | §62 | Feature Flags | [SECURITY_MODEL.md](SECURITY_MODEL.md) | Security/domain owner | 1 onward |
| SCOPE-063 | §63 | Testing Strategy | [TEST_STRATEGY.md](TEST_STRATEGY.md) | QA | 1 onward |
| SCOPE-064 | §64 | Unit Testing | [TEST_STRATEGY.md](TEST_STRATEGY.md) | QA | 1 onward |
| SCOPE-065 | §65 | Integration Testing | [TEST_STRATEGY.md](TEST_STRATEGY.md) | QA | 1 onward |
| SCOPE-066 | §66 | Contract Testing | [TEST_STRATEGY.md](TEST_STRATEGY.md) | QA | 1 onward |
| SCOPE-067 | §67 | Browser E2E Matrix | [E2E_TEST_MATRIX.md](E2E_TEST_MATRIX.md) | QA | 2 onward |
| SCOPE-068 | §68 | Security Testing | [SECURITY_MODEL.md](SECURITY_MODEL.md) | Security/domain owner | 1 onward |
| SCOPE-069 | §69 | Performance Testing | [TEST_STRATEGY.md](TEST_STRATEGY.md) | QA | 1 onward |
| SCOPE-070 | §70 | Resilience & Chaos Scenarios | [TEST_STRATEGY.md](TEST_STRATEGY.md) | QA | 1 onward |
| SCOPE-071 | §71 | CI/CD Pipeline | [CI_CD.md](CI_CD.md) | Platform | 1 |
| SCOPE-072 | §72 | Environments | [INFRASTRUCTURE.md](INFRASTRUCTURE.md) | SRE | 1 onward |
| SCOPE-073 | §73 | Database & Migration Policy | [DATA_MODEL.md](DATA_MODEL.md) | Backend | 1 onward |
| SCOPE-074 | §74 | Backup & Disaster Recovery | [RUNBOOKS.md](RUNBOOKS.md) | SRE | 1 harness; 15 restore |
| SCOPE-075 | §75 | Compliance & Legal Readiness | [COMPLIANCE_BOUNDARIES.md](COMPLIANCE_BOUNDARIES.md) | Product/Legal | 0; scoped enablement later |
| SCOPE-076 | §76 | Fraud & Risk | [SECURITY_MODEL.md](SECURITY_MODEL.md) | Security/domain owner | 1 onward |
| SCOPE-077 | §77 | Marketplace Moderation | [SECURITY_MODEL.md](SECURITY_MODEL.md) | Security/domain owner | 1 onward |
| SCOPE-078 | §78 | Search Ranking Principles | [PRODUCT_DOMAIN_MAP.md](PRODUCT_DOMAIN_MAP.md) | Search | 4/7 |
| SCOPE-079 | §79 | SEO Requirements | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-080 | §80 | Internationalization & Currency | [COMPLIANCE_BOUNDARIES.md](COMPLIANCE_BOUNDARIES.md) | Product/Legal | 0; scoped enablement later |
| SCOPE-081 | §81 | Email & Communication | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-082 | §82 | API Security | [SECURITY_MODEL.md](SECURITY_MODEL.md) | Security/domain owner | 1 onward |
| SCOPE-083 | §83 | Error Handling Standard | [API_BOUNDARIES.md](API_BOUNDARIES.md) | API | 1 onward |
| SCOPE-084 | §84 | Product State UI Requirements | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-085 | §85 | Enterprise Features | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-086 | §86 | Mobile Strategy | [UI_INFORMATION_ARCHITECTURE.md](UI_INFORMATION_ARCHITECTURE.md) | Product/Frontend | 2–14 by feature |
| SCOPE-087 | §87 | Non-Functional Requirements | [OBSERVABILITY.md](OBSERVABILITY.md) | SRE | 1 baseline; 15 proof |
| SCOPE-088 | §88 | Project Phases | [PHASE_ACCEPTANCE_MATRIX.md](PHASE_ACCEPTANCE_MATRIX.md) | Product/QA | 0–15 |
| SCOPE-089 | §89 | Phase Governance | [PHASE_ACCEPTANCE_MATRIX.md](PHASE_ACCEPTANCE_MATRIX.md) | Product/QA | 0–15 |
| SCOPE-090 | §90 | Definition of Done | [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) | Engineering/QA | 0 onward |
| SCOPE-091 | §91 | Deadline Protection & Delivery Discipline | [PROJECT_RISK_REGISTER.md](PROJECT_RISK_REGISTER.md) | Product/Architecture | 0 onward |
| SCOPE-092 | §92 | Required Project Documents | [adr/README.md](adr/README.md) | Architecture | 0; recheck before implementation |
| SCOPE-093 | §93 | Architecture Decision Records | [adr/README.md](adr/README.md) | Architecture | 0; recheck before implementation |
| SCOPE-094 | §94 | Launch KPIs | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-095 | §95 | Acceptance Criteria for MVP | [PHASE_ACCEPTANCE_MATRIX.md](PHASE_ACCEPTANCE_MATRIX.md) | Product/QA | 0–15 |
| SCOPE-096 | §96 | Explicitly Out of Scope for Initial Release | [COMPLIANCE_BOUNDARIES.md](COMPLIANCE_BOUNDARIES.md) | Product/Legal | 0; scoped enablement later |
| SCOPE-097 | §97 | Known High-Risk Areas | [PROJECT_RISK_REGISTER.md](PROJECT_RISK_REGISTER.md) | Product/Architecture | 0 onward |
| SCOPE-098 | §98 | Name Strategy | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-099 | §99 | Brand Architecture | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-100 | §100 | Final Product Architecture | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-101 | §101 | Engineering North Star | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |
| SCOPE-102 | §102 | External Standards / Research Inputs | [adr/README.md](adr/README.md) | Architecture | 0; recheck before implementation |
| SCOPE-103 | §103 | Final Scope Decision | [MASTER_PRODUCT_SPEC.md](MASTER_PRODUCT_SPEC.md) | Product | 0 |

Change requests identify priority/reason, affected sections/domains/contracts, phase/time impact, new tests and security/compliance implications. Append or supersede an ADR for material changes. Do not mutate the preserved master silently. [Risk register](PROJECT_RISK_REGISTER.md) and phase reports record explicit deferrals, owners and evidence.
