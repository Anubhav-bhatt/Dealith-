# ADR-004: PostgreSQL search with a provider boundary

Status: Recorded baseline, 2026-09-07. Sources: master §§18–19, 49, 78, 93. Implementation begins PHASE-04.

## Context and decision

Start with PostgreSQL text search and indexed structured filters over a rebuildable, public-only SearchProjection. The Search port owns validated filter AST, cursor semantics, safe source fields, versioned deterministic ranking and indexing checkpoints. Every result is checked against current publication/risk eligibility; index removal is an additional safeguard. Saved searches and alerts rerun current visibility policy. Private exact financials, source and documents never enter public facets or embeddings.

Semantic retrieval is optional in PHASE-07 after offline relevance, leakage and latency evaluation. Evaluate a PostgreSQL vector extension then; supported version selection requires implementation evidence. OpenSearch is deferred until measured scale or relevance requirements justify a new service. Search should degrade visibly without blocking authoritative deal commands. See [domain map](../PRODUCT_DOMAIN_MAP.md) and [observability](../OBSERVABILITY.md).

## Alternatives and consequences

OpenSearch from day one adds a cluster and synchronization boundary without measured need. Direct queries over private source tables risk accidental disclosure. Database text search offers simpler recovery but needs representative query/index benchmarks and may eventually require extraction. AI ranking cannot silently override deterministic eligibility or turn unverified claims into facts.

## Verification and revisit

PHASE-04 proves browse/search/filter correctness, safe facet payloads, suspend/purge races, cursor behavior, rebuild parity and p95 target under a recorded workload. PHASE-07 proves semantic relevance against a retained deterministic baseline before enabling it. New index engines preserve access filters and replay contracts through a reviewed ADR.
