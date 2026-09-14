# ADR-007: Central AI gateway without transaction authority

Status: Recorded baseline, 2026-09-07. Sources: master §§3, 27–31, 93. Optional intelligent features begin PHASE-07.

## Context and decision

All models/providers are accessed through a server-only AI Gateway with task routing, schemas, prompt/model versions, budget/rate controls, redaction, evaluation and traceable evidence references. Authorize retrieval before prompt construction and authorize results again before delivery. Scope caches and indexes by current principal/resource/policy revision; revocation invalidates future use. Treat seller text, files and repository content as untrusted data and test prompt injection.

AI drafts and advises. It cannot grant access, approve ownership/verification, decide legal eligibility, accept an offer, change a state machine, instruct settlement, reveal secrets or execute arbitrary seller code. Structured suggestions require normal human confirmation and deterministic command validation. Claims retain evidence class, source date and uncertainty; unavailable evidence is not a fabricated value. Providers are selected by contractual data handling, retention, region, task evaluation and costs, not by embedding SDK types throughout the product. See [AI architecture](../AI_ARCHITECTURE.md).

## Alternatives and consequences

Direct browser/model access exposes secrets and bypasses permissions. Unrestricted agents conflict with deterministic financial and authorization controls. A gateway concentrates enforcement but needs regression evaluation, circuit breakers and observability; provider abstraction does not imply equal quality or automatic safe failover.

## Verification and revisit

PHASE-07 requires permission-leakage and injection evaluations, evidence citations, schema validation, budget/outage behavior and deterministic fallback. A provider/model/prompt change reruns the task evaluation before rollout. Autonomous financial/legal/access authority remains excluded; changing that boundary would require a new scope decision, not a feature flag alone.
