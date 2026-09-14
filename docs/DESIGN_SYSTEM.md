# Design system

Status: Phase 0 specification, 2026-09-07; components are implemented from Phase 1. Sources: master §§55–57, 84 and 98–99. The working brand is Dealith; brand clearance remains a launch gate. Direction: clear typography, restrained surfaces, visible evidence and careful financial confirmations.

## Token contract

| Family | Initial specification | Implementation acceptance |
|---|---|---|
| Typography | System sans for interface, monospace for IDs; 14/16/20/24/32/40 px scale, body line-height 1.5; tabular figures for money | Relative units, zoom/reflow, readable line lengths and unambiguous currency |
| Spacing | 4 px base; 4/8/12/16/24/32/48/64 px tokens | Consistent rhythm, touch space, no clipped localized labels |
| Surfaces / text | Light canvas, distinct base/raised/muted surfaces; primary/secondary/disabled text tokens | All foreground/background pairs measured; dark theme only after equivalent verification |
| Brand / action | Deep blue primary action; neutral secondary, explicit destructive action | Focus and state remain distinguishable without color |
| Semantic state | Info, pending, success, warning, danger, neutral; each includes foreground/surface/border/icon/text | Pending never styled as confirmed; evidence class not equated with a success score |
| Borders / radii | 1 px standard border; 4/8/12 px radii, full only for pills/avatars | Grouping clear at zoom/high contrast; financial terms remain readable |
| Elevation | Flat base, subtle raised panel, deliberate overlay shadow | No essential boundary conveyed only by shadow |
| Focus | High-contrast outline with offset; never removed without equivalent replacement | Keyboard focus visible and not obscured by sticky UI |
| Motion | 120/180/240 ms for purposeful feedback; reduced-motion variant removes nonessential transitions | No animation required to understand state or complete a task |
| Breakpoints | Content-led targets near 640/768/1024/1280 px; layouts tested at narrow mobile widths | No ordinary-flow horizontal overflow; tables use labeled controlled regions |

These are design defaults rather than a claim of measured contrast or conformance. Phase 1 implements semantic CSS variables in `packages/ui`, documents supported combinations and tests representative components. WCAG 2.2 AA is the acceptance target for complete processes, including keyboard, focus, errors, contrast, reflow and target size. Automated checks supplement manual testing. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Component inventory and behavior

| Group | Components | Required behavior |
|---|---|---|
| Actions and forms | Button, input, textarea, select, combobox, checkbox, radio, date picker, form/error summary | Accessible names, pending/disabled distinction, inline plus summarized errors, keyboard selection, preserved safe input |
| Overlays and feedback | Modal, drawer, popover, tooltip, toast, alert | Focus management/return, Escape where appropriate, no tooltip-only essential instructions, persistent critical errors |
| Content | Card, project card, metric, badge, verification badge, score, chart | Claim provenance/confidence/age, unknown values distinct from zero, chart text/table alternative |
| Data and process | Data table, stepper, timeline, deal stage, document row, upload, permission selector | Sorting/filter labels, current/completed distinction, immutable version context, scan/denied/expired states |
| Application states | Empty state, skeleton, error state, offline notice, unavailable capability | Contextual next step, stable layout, no concealed failure, retry only when safe |

Display financial values with explicit currency and locale formatting while preserving exact stored values. A comparison cannot imply ordering across currencies without a visible dated conversion basis. Do not use a progress bar to imply guaranteed settlement completion. Signed/verified/funded badges require authoritative evidence and provide accessible text explaining their exact scope.

Shared primitives contain presentation and accessibility logic; policy decisions come from API capability DTOs and still revalidate server-side. No component imports backend persistence or provider SDKs. Build a documented component gallery with representative long text, empty/error, keyboard, mobile and high-contrast cases. Visual snapshots may supplement behavior tests but cannot prove authorization or financial correctness.

## Delivery and review

Phase 1 supplies tokens, base forms, layout, error and loading primitives. Feature phases add domain components with the [UI information architecture](UI_INFORMATION_ARCHITECTURE.md) states. Phase acceptance requires responsive and accessibility evidence for complete relevant journeys. Brand, icons and media must have recorded usage rights; AI-generated or stock imagery never serves as fabricated project verification evidence.
