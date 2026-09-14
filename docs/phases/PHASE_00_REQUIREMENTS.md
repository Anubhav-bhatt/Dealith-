# Phase 00 requirements

Status: Phase 0 continuation acceptance contract, 2026-09-07. These IDs organize the preserved master and existing architecture obligations; they do not claim to reproduce a missing earlier prompt.

| Requirement ID | Requirement | Acceptance | Evidence location |
|---|---|---|---|
| P0-001 | Preserve source and provenance | Original SHA-256 unchanged; honest initial and continuation filesystem inventory | Master/inventory/README |
| P0-002 | Complete product coverage | All 104 numbered master sections mapped and all 51 domain rows retained | Product spec/domain map |
| P0-003 | Define module and data boundaries | Canonical entity/alias coverage, clear write ownership and backend dependency direction | Architecture/data/API/ADRs |
| P0-004 | Freeze lifecycle contracts | Exactly 17 Project/28 Deal states; unique guarded edges and matching adjacency/registry | State docs/registry |
| P0-005 | Define authorization and private disclosure | Default deny, active scope/NDA, DTO/object/cache/worker policy and threat mitigation | Security/RBAC/VDR/threat |
| P0-006 | Specify transaction/evidence correctness | Immutable offers/signatures, reservation, transfer/inspection, exact funds and unknown outcome recovery | Offer/diligence/settlement model |
| P0-007 | Define event reliability | Master/domain/lifecycle event coverage, single owner and durable idempotent delivery | Events/data/state docs |
| P0-008 | Constrain integrations and AI | Advisory AI, progressive repository access, safe previews, provider and crypto gates | AI/repository/preview/crypto/compliance |
| P0-009 | Define complete user experience | Persona routes, wizard, comparison, deal room, all states and accessible tokens/components | UI/design/product spec |
| P0-010 | Define operations and delivery | CI trust, environments, telemetry, recovery/runbook and measured future gates | CI/infrastructure/deployment/observability/runbooks |
| P0-011 | Retain acceptance coverage | All master §67 scenario aliases, unique E2E IDs, positive/negative evidence and Phase 0–15 exits | E2E/test/phase/DoD |
| P0-012 | Record decisions and risk | 16 indexed ADRs, material amendments and owned triggered risk/deferral records | ADRs/risk/compliance |
| P0-013 | Validate documents reproducibly | Checker detects structural drift and bad fixtures; no fabricated runtime result | Validator/test matrix |
| P0-014 | Record phase evidence and handoff | Plan/requirements/test/report complete, actual commands/results and next gate | Phase 0 report |

[Plan](PHASE_00_PLAN.md), [test matrix](PHASE_00_TEST_MATRIX.md) and [report](PHASE_00_REPORT.md) retain execution evidence. Future provider/jurisdiction/version choices have explicit phase gates and do not imply production authorization.
