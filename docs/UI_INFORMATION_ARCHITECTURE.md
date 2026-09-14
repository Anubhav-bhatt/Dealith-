# UI information architecture

Status: Phase 0 baseline, 2026-09-07. Sources: master §§4, 10–26, 32–43, 55–57, 79 and 84–86. Routes below are design targets. [Design system](DESIGN_SYSTEM.md), [API](API_BOUNDARIES.md) and [authorization](RBAC_ABAC_MATRIX.md) apply to every screen.

## Navigation and personas

| Surface / target route | Persona and purpose | Principal actions and disclosure |
|---|---|---|
| `/`, `/marketplace`, `/categories/[slug]`, `/projects/[slug]` | Visitor or member discovers approved listings | Public search/filter/detail, safe preview and confidence labels; authenticate for saving/access |
| `/pricing`, `/how-it-works`, `/trust`, `/help`, `/legal/[page]` | Public education and verified published policies | Show only available capability; no implied legal/provider or brand clearance |
| `/auth/*`, `/onboarding`, `/settings/security` | Person authenticates and selects coexisting intents | Verify, reset, MFA, sessions, step-up; safe errors; organization selection separate from identity |
| `/workspace`, `/workspace/projects/*` | Founder/seller drafts and manages listings | Wizard, approved versus draft revision, submission feedback, pause; named owner/reviewer rules |
| `/watchlists`, `/saved-searches`, `/deal-cart` | Buyer/scout evaluates opportunities | Private notes, tags, alerts, compare 2–5 independently authorized projects; initiate one Deal |
| `/access-requests` | Requester or seller controls disclosure | Separate inboxes, purpose/category/expiry, partial decision, revoke, NDA requirement |
| `/deals`, `/deals/[id]/*` | Named buyer/seller/advisor/counsel works on a Deal | Overview, activity, participants, messages, NDA, data room, offers/LOI, diligence, agreements, settlement, transfer |
| `/portfolio` | Completed rights holder or seller reviews history | Authorized completed records, scope of rights, safe metrics/notes; no implied new document access |
| `/organizations/[id]/*`, `/settings/billing` | Authorized organization/team/billing administrator | Membership/mandates and plan/invoices; organization admin does not inherit confidential deal scope |
| `/notifications`, `/settings/preferences` | Recipient handles alerts | Safe deep links reauthorize destination; marketing preference distinct from required security alerts |
| Separate admin origin `/admin/*` | Assigned staff with MFA | Review, verification, risk/compliance, disputes, audit, support, configuration; reasons and scopes explicit |

Intents can coexist. The active represented organization is visible before sensitive actions; switching it clears scoped caches and rechecks permissions. Staff and customer sessions remain separate. Navigation visibility is a usability aid; the API remains authoritative. A logged-out user receives a return destination only from an allowlisted local route.

## Publishing and discovery

The wizard preserves all 15 master steps: Identity; Problem; Solution; Product Preview; Capabilities/Services; Business; Market; Technology; Metrics; Team; Deal; Verification; Visibility; Preview; Submit. Save drafts with expected revision/version and show saved, saving, conflict and offline states. Step requirements depend on asset, maturity and deal policy. Unknown metrics stay unknown, distinct from zero; financial exacts and public bands have separate fields. Each evidence claim displays provenance and validity. Final preview uses the actual public projection and separately labeled permitted private previews.

Submission presents missing fields, blocked evidence and prohibited-content findings. Owner cannot self-approve. Review changes reference the submitted immutable revision. Editing a live listing visibly distinguishes the current public revision from pending edits. Withdrawal/pause warns about listing visibility without claiming to cancel existing obligations.

Discovery keeps shareable safe filters/sort in the URL, stable cursor pagination, clear filtered-empty reset and accessible cards. Project detail progressively presents overview, problem/solution, showcase, capabilities, business/market, technology, evidence/metrics, team and available deal options. Protected sections explain the current access requirement without disclosing hidden values. Search, cards, SEO, structured data and social previews use only approved public fields.

Deal Cart compares 2–5 opportunities in a matrix with per-cell evidence/confidence and unavailable/permission states. On narrow screens use a project selector and stacked comparable categories. Notes remain private or explicitly team-scoped. Selecting an opportunity creates/returns one independent Deal; there is no combined price, checkout or bulk settlement.

## Deal workspace

Show current workflow stage, accepted terms version, represented party, next permitted action and outstanding blockers. The timeline distinguishes requested, provider-pending, confirmed, rejected and disputed facts. Never show funded or signed based on a redirect. An unknown payment outcome displays reconciliation progress and a support reference, with conflicting retries unavailable.

NDA and agreement review identify the exact version, required signers and provider handoff; return pages poll authoritative status. Data room exposes only authorized folders/counts/documents. Show expiry, watermark/download policy and denial without leaking filenames. Restricted viewing uses the gateway; copy warnings do not promise screenshot prevention.

Offers present immutable revision comparison, terms/conditions, expiry, counterparty and explicit accept/counter/reject controls. Acceptance and financial commands include a review step showing exact currency/amount, rights, destination reference and effect; require normal domain validation and step-up when applicable. Diligence separates submission from reviewer decisions. Transfer separates submitted proof, recipient confirmation and inspection acceptance. Staff tools call the same domain commands and show evidence/reason requirements.

## Required states and accessibility

Every major screen designs loading, useful skeleton, initial empty, filtered empty, success, recoverable error, fatal error, permission denied, expired access and offline/network states. Preserve recoverable form input while preventing secrets from persisting in browser storage. Conflicts reload/review the authoritative revision; they do not silently overwrite another actor's work. Provider/model outages leave ordinary discovery and authorized deal records usable.

Use semantic landmarks/headings, keyboard navigation, visible focus, announced form errors, accessible dialogs and non-color status labels. Responsive flows must support mobile; complex tables can use explicitly labeled scroll regions or focused detail views. Full task completion, including provider handoffs, is in the accessibility test plan. [E2E matrix](E2E_TEST_MATRIX.md) covers journeys and negative states; no UI is accepted from screenshots alone.
