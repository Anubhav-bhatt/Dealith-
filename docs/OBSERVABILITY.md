# Observability

Status: frozen target; no telemetry deployment or measured SLO result exists in Phase 0. Source: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md), sections 58–61. Ownership: SRE for platform signals, domain owners for business invariants, Security for restricted security telemetry.

## Instrumentation and data boundaries

Use OpenTelemetry SDK instrumentation in `apps/web`, `apps/admin`, `apps/api`, `apps/worker` through `packages/observability`, exported through an OpenTelemetry Collector. Structured JSON logs, metrics and distributed traces share an allowlisted correlation context. Inbound HTTP, outbound provider calls, database operations, outbox publication and BullMQ processing form connected spans. Queued work persists `traceparent` and a bounded allowlisted `tracestate`, with span links for retries/reconciliation; external trace context is validated and never trusted for identity or authorization. OpenTelemetry context propagation supplies the correlation mechanism across execution boundaries. [OpenTelemetry context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)

| Field | Requirement |
|---|---|
| timestamp, severity, service, module, environment, version | All structured records; UTC timestamps |
| requestId, traceId | Every HTTP request and linked worker execution; generate server request ID, validate external correlation |
| userId, organizationId | Pseudonymous internal IDs only when authorized context exists; never email or claimed browser tenant |
| projectId, dealId, settlementId | Relevant object IDs in restricted logs/traces; avoid high-cardinality metric labels |
| eventId, operationId, providerEventId, jobId, attempt | Relevant asynchronous/mutation contexts; references only, no provider secrets |
| action, outcome, errorCode, durationMs | Bounded stable names; safe errors; no raw SQL/HTTP bodies |

Metric labels use service, route template, method, bounded status class, domain, provider adapter, queue and environment; no user, organization, document or financial identifiers. Traces/logs carry restricted IDs subject to access and retention policy. Audit is a separate durable business record, not sampled telemetry. Operational logs cannot replace required audit commits.

Never record passwords, password hashes, cookies, authorization headers, reset/MFA tokens, raw signed URLs, private keys/seed phrases, payment credentials, raw KYC, document/source contents, confidential message bodies, prompts or model responses. Default-disable HTTP body capture and SQL parameter logging. AI traces contain redaction status, prompt version, model alias, latency, token counts and result status without confidential text. Redaction tests run in CI; the Collector performs a second allowlist/redaction layer. Telemetry endpoints require authentication and network isolation; analyst access is role-scoped and audited.

## Initial objectives and measurements

These are architectural targets, not fabricated measurements. Phase 1 records a reproducible baseline; Phase 15 must demonstrate the production-candidate workload. Product/SRE may revise workload sizing with an ADR and evidence, without silently relaxing financial/audit correctness.

| Objective | SLI and scope | Evaluation |
|---|---|---|
| Normal API p95 < 400 ms | Edge request receipt to final response byte for ordinary synchronous non-search endpoints, including authorization and DB; excludes file streaming and asynchronous provider/AI completion; asynchronous acknowledgment included | Rolling 7-day and 30-day production histograms; steady-load benchmark per route family |
| Search p95 < 600 ms | Same boundary for search response including filtering/projection; empty or degraded results separately counted | Rolling 7-day/30-day; cold and warm search benchmark |
| Server error rate < 0.5% | 5xx + timeouts + capacity-caused 429 over eligible API requests; intentional abuse-rate-limit denials reported separately | 30-day and release benchmark; errors never removed because dependency caused them |
| Project LCP < 2.5 s | Public project detail Real User Monitoring p75, segmented mobile/desktop and geography; synthetic mobile budget is release proxy | Rolling 28-day RUM; agreed test device/network recorded |
| Core availability 99.9% | Monthly eligible read/write requests meeting documented success semantics, with synthetic checks covering low-traffic intervals; core auth/project/access/deal APIs; planned downtime included | Monthly error budget 0.1%; 30 days gives 43.2 minutes equivalent time budget |
| Financial duplication 0 | Count of duplicate externally effective financial instructions or duplicate normalized ledger effects per operation | Continuous invariant + reconciliation; any confirmed duplicate triggers incident and mutation kill switch |
| Audit event loss 0 | Committed auditable actions without durable audit record/outbox acknowledgment chain | Continuous DB/stream checks and restore reconciliation; any discrepancy triggers incident |

Baseline workload proposal for capacity verification: synthetic 100,000 public projects, 10,000 users, 1,000 organizations, 10,000 deals and 100,000 document metadata rows; 100 concurrent active sessions, 50 API requests/second for 30 minutes (40% browse/detail, 20% search, 15% authenticated workspace reads, 10% messages/data-room metadata, 10% authorized commands, 5% auth). This is a planning workload, not a forecast. Use unique tenant fixtures and a 5-minute warm-up excluded from steady-state percentiles but reported separately. Run 3× request bursts for 5 minutes and 100 provider callbacks/second, including duplicates, with invariant checks. Document synthetic mobile parameters: 4× CPU slowdown, 1.6 Mbps down, 750 Kbps up, 150 ms RTT; retain browser version and device profile. Provider/AI completion latency uses separate adapter-specific SLIs; queue acceptance alone cannot represent completed business work.

## Dashboards, alerts and response

| Dashboard | Signals / initial alert | Owner and response |
|---|---|---|
| Edge/API | Traffic, p50/p95/p99, errors, WAF denies, availability burn | SRE; 14.4× budget burn over 1h plus 5m page; 6× over 6h plus 30m page; slower burn ticket |
| Database | Connections, lock wait/deadlock, CPU, IOPS, replication/failover, backup age | SRE; capacity trend ticket, failed writes/failover page |
| Redis/queues/outbox | Availability, lag, backlog age, retries, DLQ, job duplicates | Platform; critical outbox oldest age >60s for 5m page; noncritical backlog >5m ticket; financial jobs halted/reviewed on unknown status |
| Search/discovery | Latency, stale projection version, indexing lag, public-field policy violations | Marketplace; cache purge/index failure page when suspended data remains exposed; safe removal/uncached read fallback |
| Documents | Scan queue, malware/quarantine, denied views, expired grants, issuance failures | Security + VDR; malware alert, unknown scan status stays unavailable |
| AI | Cost, tokens, latency, provider errors, redaction failures, eval regressions | Intelligence; budget/fallback degradation; redaction leak page and disable AI feature |
| Webhooks/settlement | Signature failures, duplicates, event gaps, provider lag, reconciliation mismatches, unknown operations | Settlement operations; duplicate effect, destination change anomaly, mismatch or unconfirmed release pages; block mutations pending reviewed reconciliation |
| Security/admin | Session abuse, cross-tenant denials, MFA changes, break-glass, privileged exports | Security; anomalous privileged use page; audit evidence preserved |
| Product | Funnel counts, discovery-to-access, consented engagement, deal stage duration | Product; aggregate authorized data, minimum cohort rules; never publicize private metrics |

Alerts link to a runbook owner, service/version, safe trace reference, recent deployments and recovery action. Create dependency outage, document leak, settlement reconciliation, admin compromise, DB restore and rollback runbooks in implementation phases; Phase 15 requires on-call ownership and a tested escalation rota. Synthetic alerts must be exercised before production.

Operational baseline retention target: traces 14 days, application logs 30 days, aggregate metrics 13 months; incident evidence may be retained under approved hold. These are operational defaults subject to jurisdictional retention approval; financial/audit/document retention follows domain policy rather than these shorter TTLs. Production telemetry remains isolated from nonproduction accounts. Cost caps and sampling can reduce ordinary successful traces; errors, financial mutation metadata and required audit records must preserve sufficient investigation evidence, with audit never sampled.
