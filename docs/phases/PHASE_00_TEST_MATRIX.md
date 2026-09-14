# Phase 00 test matrix

Status: document verification only. Actual execution results belong in the [report](PHASE_00_REPORT.md).

| Check ID | Method | Acceptance / limit |
|---|---|---|
| DOC-001 | Preserved SHA-256 and master heading inventory | Exact baseline bytes and sections 0–103 |
| DOC-002 | Required file/ADR/phase document inventory and local Markdown links/anchors | Complete canonical set with no missing local target; external URL availability not certified |
| DOC-003 | Product section and domain/entity/API/event coverage | 104 unique trace rows, 51 named domains, all master entities/aliases, API roots and minimum events |
| DOC-004 | Lifecycle registry and Markdown adjacency/detail comparisons | Exact state sets, unique edge IDs/pairs, nonempty contracts, reachability and full field parity |
| DOC-005 | E2E, phase and requirement/ADR identifiers | All master scenario aliases; unique IDs and valid phase mappings; 16 phases/ADRs |
| DOC-006 | Deliberately corrupted temporary copies | Missing file/broken link, missing event, changed guard, invalid state/scenario/master are rejected |
| DOC-007 | Cross-document semantic review | Ownership/names, protected disclosure, financial uncertainty, event cause and early phase kernels consistent |
| DOC-008 | Evidence/provenance review | Runtime checks explicitly unrun; no Git/deployment/approval claims without evidence |

Run `python3 tools/validate_phase0.py` and `python3 -m unittest discover -s tools -p 'test_validate_phase0.py'` from the repository root. Automated success establishes only implemented structural checks; DOC-007/008 require separate reading and reported findings. Critical unresolved architecture discrepancies block the document gate. No application test suite exists in this phase.
