# Architecture decisions

These records define the Phase 0 architecture baseline against the unchanged [master scope](../../DEALITH_MASTER_PROJECT_SCOPE.md), especially §93. Status **Recorded baseline** means an implementation decision is documented; it does not assert human sign-off, vendor procurement, legal clearance, implemented controls or production approval. The [Phase 0 report](../phases/PHASE_00_REPORT.md) records actual validation and outstanding gates.

| ADR ID | Decision | Master sections | Status | First implementation gate |
|---|---|---|---|---|
| ADR-001 | [Modular monolith](ADR-001-modular-monolith.md) | 3, 48, 52, 93 | Recorded baseline | PHASE-01 |
| ADR-002 | [Monorepo and dependency boundaries](ADR-002-monorepo.md) | 48–50, 93 | Recorded baseline; layout amendment | PHASE-01 |
| ADR-003 | [PostgreSQL and Prisma](ADR-003-database.md) | 49, 51, 73, 93 | Recorded baseline | PHASE-01 |
| ADR-004 | [Search](ADR-004-search.md) | 18–19, 49, 78, 93 | Recorded baseline | PHASE-04 |
| ADR-005 | [Object storage](ADR-005-object-storage.md) | 26, 45–49, 74, 93 | Recorded baseline | PHASE-03 |
| ADR-006 | [Authentication and sessions](ADR-006-authentication.md) | 12–14, 44, 46, 82, 93 | Recorded baseline | PHASE-02 |
| ADR-007 | [AI provider architecture](ADR-007-ai-provider-architecture.md) | 3, 27–31, 93 | Recorded baseline | PHASE-07 |
| ADR-008 | [Subscription payments](ADR-008-subscription-payments.md) | 36, 42, 85, 93 | Recorded baseline; provider unselected | PHASE-14 |
| ADR-009 | [Escrow provider abstraction](ADR-009-escrow-provider.md) | 8, 35–38, 75, 93 | Recorded baseline; provider unselected | PHASE-11 |
| ADR-010 | [Crypto boundary](ADR-010-crypto-boundary.md) | 8–9, 36, 75, 93, 96 | Recorded baseline; capability disabled | Future enablement |
| ADR-011 | [Events and transactional outbox](ADR-011-events-outbox.md) | 47, 53–54, 59–61, 93 | Recorded baseline | PHASE-01 |
| ADR-012 | [Document security](ADR-012-document-security.md) | 23–29, 45–47, 93 | Recorded baseline | PHASE-03 kernel; PHASE-08 full |
| ADR-013 | [Infrastructure](ADR-013-infrastructure.md) | 48–49, 59–62, 72, 74, 93 | Recorded baseline | PHASE-01 nonproduction |
| ADR-014 | [Deployment and recovery](ADR-014-deployment.md) | 63–74, 87–91, 93 | Recorded baseline | PHASE-01; PHASE-15 launch |
| ADR-015 | [Multi-tenancy](ADR-015-multi-tenancy.md) | 14, 23–26, 44–45, 51, 85, 93 | Recorded baseline | PHASE-02 |
| ADR-016 | [Scope and naming clarifications](ADR-016-scope-clarifications.md) | 7–9, 16, 33, 50–51, 88–96 | Recorded baseline; explicit clarifications | PHASE-00 and dependent phase |

| ADR-017 | [Local foundation toolchain and verification](ADR-017-local-foundation.md) | 48–50, 63–74, 88–93 | Implemented local amendment | PHASE-01 local |

| ADR-018 | [Expanded runtime certification](ADR-018-runtime-certification.md) | 48–50, 63–74, 88–93 | Implemented refinement | PHASE-01 |

An ADR change records context, alternatives, decision, consequences, affected contracts/data/tests/phases, author and actual review evidence. Preserve history: supersede a record with a linked new decision rather than rewriting the original master. Material security or financial changes require the relevant domain owner review before implementation; production enablement also requires the capability gates. No reviewer names or approvals are fabricated in this baseline. Compatible version selection is a Phase 1 task; this index is not a package version manifest.
