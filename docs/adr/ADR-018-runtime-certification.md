# ADR-018: Expanded foundation runtime certification

Status: Implemented refinement, 2026-09-11; no external deployment or human review approval asserted. Context: the expanded Phase 1 request requires a stricter runtime baseline than the earlier user-selected local scope recorded by ADR-017.

## Decision

Preserve the pnpm/Nest/Next/Prisma/PostgreSQL/Redis modular foundation and four infrastructure tables. Keep the single Audit-owned synthetic `audit.recorded` event as the harmless queue certification rather than creating a second dummy protocol; it proves atomic audit/outbox, retry, deduplication, queue loss and restore. AuthPlaceholderModule and AuditPlaceholderModule explicitly state that user authentication and business audit APIs are absent; existing platform audit persistence is real.

Add canonical health/readiness/version HTTP roots with old probe aliases retained. Enable exact configured CORS origins for read-only foundation endpoints; CORS is not authorization. Add safe error categories, request/trace metadata and optional bounded W3C traceparent in the event envelope so persisted intent can retain correlation after a restart. Use manual OpenTelemetry spans/metrics at HTTP, readiness database/Redis, outbox and queue boundaries. A configured OTLP HTTP collector is optional; disabled telemetry preserves local correlation without external export.

Replace the prior marketing scaffold with temporary certification surfaces. Tailwind and semantic CSS tokens support reusable controls; request nonces and dynamic rendering allow a production script CSP without unsafe-inline script execution. Inline styles remain permitted for framework compatibility; no user content or rich editor exists in Phase 1. Production public origins require HTTPS. Standalone builds remain independently deployable. Runtime packages are separately assembled with pnpm production deploy; migration tools run in an explicitly separate one-shot image.

## Alternatives and consequences

Keeping only the legacy probe routes would miss the explicit runtime contract; aliases avoid breaking existing runbooks. Adding SystemMetadata or business entities would add no evidence beyond the existing infrastructure harness. Replacing native tests with mocks would weaken transaction/recovery evidence. Native isolated services remain an allowed local fallback; absent Docker is reported, not asserted equivalent to Linux container execution. Shared DTOs/validation remain independent from Prisma entities.

Exact existing framework/runtime pins remain. Tailwind 4.3.3, axe Playwright 4.13.0 and OpenTelemetry metrics SDK/exporter versions matching the trace stack are added for requirements, not new product scope. A targeted `@nestjs/platform-express>multer` 2.3.0 override remedies advisories found during the fresh audit; no file-upload endpoint is enabled. Reassess the override when Nest incorporates the patch. Primary records: [crafted field names](https://github.com/advisories/GHSA-wc9g-mqfw-jrwm), [aborted uploads](https://github.com/advisories/GHSA-qfvm-cv95-jqjf), [array indexes](https://github.com/advisories/GHSA-535w-7cp7-47q4).

## Verification and remaining gate

The [Phase 1 test matrix](../phases/PHASE_01_TEST_MATRIX.md) and [report](../phases/PHASE_01_REPORT.md) contain actual evidence. Local suite success cannot certify the authored Dockerfiles or remote CI. The user deferred repository selection and prohibited pushes; remote CI remains NOT RUN. The Phase 0 product/security/financial boundaries remain unchanged.
