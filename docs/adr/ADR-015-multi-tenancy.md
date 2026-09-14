# ADR-015: Explicit ownership and cross-organization participation

Status: Recorded baseline, 2026-09-07. Sources: master §§14, 23–26, 44–45, 51, 85, 93. Implementation begins PHASE-02.

## Context and decision

One regional database serves multiple organizations and personal workspaces. Every owned resource has an explicit owner/PartyRef; a null organization is never an unscoped wildcard. Deal participation is a separate relation so buyer and seller organizations can collaborate without merging ownership. Organization administration does not grant every deal/document permission. Membership, delegation, room/viewer groups, NDA and access grants are current scoped predicates.

Server RBAC provides coarse capability and ABAC checks actor, owner, participation, purpose, classification, grant, NDA, session assurance, jurisdiction/risk and policy revision. Apply authorization before field projection, signed capability and background delivery. PostgreSQL RLS is defense in depth using transaction-local context and a non-bypass application role; connection-pool reuse cannot inherit tenant state. Background work receives explicit scoped principals and reauthorizes. Staff need an assigned case and scoped purpose; emergency access is bounded and independently audited. See [authorization](../RBAC_ABAC_MATRIX.md) and [data model](../DATA_MODEL.md).

## Alternatives and consequences

One database per organization complicates legitimate cross-organization deals and early operations. Application filtering alone is insufficient defense against missed predicates; RLS alone cannot express all field/purpose/financial policy. UUIDs and hidden buttons provide no access guarantee. Layering server policies and RLS adds consistency/testing work but makes ownership explicit and mistakes easier to detect.

## Verification and revisit

PHASE-02 tests two unrelated tenants with similar roles, personal/organization resources, ownership transfer and connection-pool context cleanup. PHASE-06 adds legitimate cross-organization collaboration plus denial of unrelated deals; PHASE-08 covers byte/field leakage; PHASE-13 tests staff assignment and break-glass. Revisit physical tenant partitioning only for measured isolation/residency needs with safe cross-tenant deal protocols.
