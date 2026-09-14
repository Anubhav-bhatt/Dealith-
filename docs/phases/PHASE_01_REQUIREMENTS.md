# Phase 01 requirements

The expanded Phase 1 request governs. Every acceptance item appears in the [report](PHASE_01_REPORT.md); no earlier local-only exception silently relaxes it.

| ID | User request sections | Required foundation / acceptance evidence |
|---|---|---|
| P1-001 | 1–6, 43–47, 58 | Existing workspace audit; pinned supported toolchain; pnpm commands; strict types; formatter/lint/boundaries; dependency policy |
| P1-002 | 7–8, 23–24, 35–36 | Independent Next web/admin; Tailwind semantic tokens/base components; real certification; loading/error/not-found/mobile/accessibility; explicit ports |
| P1-003 | 9–11, 28–29, 40 | Nest module composition, inactive placeholders; /api/v1/health, /readiness, /version; typed safe errors and correlation IDs; API E2E |
| P1-004 | 12–16, 54–57, 64 | Independent BullMQ worker; one managed Prisma/Redis lifecycle; real migration; atomic audit/outbox; dedup/retry/replay; safe cleanup |
| P1-005 | 17–22, 25–27, 30–32, 62 | Validated config/env examples; types/validation/contracts/events/security; safe JSON logs; context, metrics/traces; CORS/CSP/headers; negative tests |
| P1-006 | 33–34, 48–53, 59 | Docker Compose persistent dependencies; multistage nonroot runtime targets; separate migrations; reproducible local guide; CI service containers/scans/build |
| P1-007 | 37–42, 63–65, 70 | Test-kit, unit/component, real integration/API E2E, Playwright/axe, loopback benchmark, clean install and fresh migrated DB |
| P1-008 | 60–61, 66–69, 71–76 | Docs/ADR refinements, no personal runtime paths or secrets, no dead marketing scaffold/business logic, exact full acceptance matrix and honest final verdict |

Real authentication, users/profiles/organizations, project creation/marketplace/search/cart/comparison, messaging/NDA/VDR/offers/deals/diligence/settlement/crypto/AI/billing/admin functionality are excluded. Four infrastructure tables already implemented remain valid: AuditEvent, OutboxEvent, ConsumerReceipt, EventProjection. SystemMetadata is a recommendation, not a reason to replace correct existing persistence.
