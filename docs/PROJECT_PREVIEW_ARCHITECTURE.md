# Project preview architecture

Status: Phase 0 architecture baseline, 2026-09-07. Authority: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md), §§15, 17, 54–56, 86 and 97. Phase 3 implements safe showcase media and buyer-facing listing preview. Related: [master architecture](MASTER_ARCHITECTURE.md), [data model](DATA_MODEL.md), [data-room security](DATA_ROOM_SECURITY_MODEL.md), [UI architecture](UI_INFORMATION_ARCHITECTURE.md).

## Scope and preview modes

`ProjectPreview` belongs to an immutable `ProjectRevision` and records a reviewed mode, external URL or controlled object reference, caption/accessibility text, scan/review status and visibility. It is a product showcase. Dealith never builds, deploys, executes or hosts arbitrary seller source, containers, notebooks, scripts or server processes. An advertised sandbox is operated externally by the seller or an approved provider; it does not create a Dealith compute runtime.

| Mode | Initial handling | Publication and user contract |
|---|---|---|
| Screenshot gallery | Quarantined uploaded media transformed to safe raster derivatives | Phase 3; captions, useful alt text, dimensions and disclosure review |
| Product video | Reviewed supported upload or approved external video provider | Phase 3; poster, captions/transcript, no audible autoplay, lazy load |
| External demo URL | Validated HTTPS link with visible destination domain | Phase 3; user chooses to leave Dealith; no embedded platform session or credentials |
| Guided interactive demo | Reviewed allowlisted provider or image-based walkthrough | Optional after provider/browser/security/accessibility review; fallback to screenshot/video |
| Externally operated sandbox | Owner-supplied description and validated external entry link | Availability is a seller claim unless separately evidenced; no shared reusable credentials in listing fields |
| Architecture/capability illustration | Scanned static media with accessible text equivalent | Same media/classification rules; no arbitrary HTML/SVG execution in the application origin |

The wizard's exact buyer-facing preview is a separate rendering mode: it projects the draft revision through the same field authorization and layout contract as the final project page. An owner can select an audience to inspect planned disclosure; this simulation is restricted to the owner and cannot grant another user a real NDA/grant. No unauthenticated draft-preview links are provided initially.

## Ingestion and publication

Uploads use the [document quarantine and clean derivative pipeline](DATA_ROOM_SECURITY_MODEL.md). Validate bytes, dimensions, size, duration, MIME and digest rather than trusting filenames. Isolate decoding/transcoding with resource limits. Remove metadata that can expose location, account names or internal paths. Reject active HTML, scripts and unsupported formats; do not rename an executable into an image extension. The Phase 3 implementation must set and test numeric media limits before accepting files, within the document upload ceiling and storage quotas.

A clean scan permits review, not automatic publication. The owner attests to media rights and reviews privacy; an assigned moderator reviews the immutable submitted revision. Crop/redact or replace screenshots that expose real customer data, credentials, private notifications or unrelated personal information. Modified media is a new derivative/version and must be checked again. AI-created or illustrative imagery cannot be presented as evidence of a functioning product.

Only the exact approved `ProjectRevision` and its approved public derivatives enter public delivery. Original uploads stay private. Public object keys are immutable and opaque; the public-media manifest references approved derivative IDs. Never toggle an original private object's ACL to public. Unpublish/suspension removes the public manifest and initiates CDN invalidation, with measured cache TTLs; already downloaded public media cannot be recalled. Sensitive content therefore must never rely on later unpublishing for protection.

Private demo media uses authorized document delivery and is absent from public metadata, HTML, React payloads and image preload lists. An approved buyer page rechecks its own grant/NDA for each protected asset; owner-preview rendering cannot contaminate the public cache. Cache keys for public media are immutable version hashes; private responses are `private, no-store` and must not pass through shared CDN storage.

## External links and embedded content

Only reviewed HTTPS destinations are accepted. Reject credentials in URLs, script/data/file schemes, malformed hosts and uncontrolled redirect parameters. Display a normalized destination domain that makes the handoff understandable. Strip unnecessary identifiers and never append Dealith session tokens, email addresses, document URLs or deal secrets. Use opener isolation and a no-referrer policy for external navigation. A public external link is not proof that its destination remains safe or available; owners and moderation can withdraw it.

No arbitrary URL screenshotter, crawler, HTML proxy or metadata fetch runs inside the application network. If a later verification worker must fetch a destination, it needs isolated egress with public-network-only policy, DNS/address validation on each connection and redirect, blocked loopback/private/link-local/cloud-metadata targets, restricted ports, size/time/redirect budgets, and no ambient credentials. URL validation alone is insufficient. Such fetches require SSRF tests before activation.

Embedding is disabled by default for arbitrary seller domains. Approved providers require a reviewed `frame-src` allowlist, least-permissive sandbox policy, no platform cookie or secret sharing, a titled frame and a fallback external link. Do not permit top navigation, popups, forms, downloads, camera/microphone or clipboard by default. Capabilities must be justified per provider. Script-enabled frames must remain cross-origin and isolated; never combine script and same-origin privileges for untrusted same-origin content. The HTML standard describes how sandbox tokens relax individual restrictions, so a sandbox attribute is not treated as a universal safety guarantee. [WHATWG iframe sandbox model](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox)

No wildcard `postMessage` channel. Any necessary messages validate exact origin, known source window, typed schema and permitted message actions; they cannot trigger privileged API calls or navigate to arbitrary URLs. Embed loading requires user interaction where it causes third-party tracking or processing; retain a usable static poster/fallback. A third party refusing framing is handled by the link fallback, not by proxying its application into Dealith.

## Presentation, accessibility and failure handling

Reserve image/video dimensions to prevent layout shifts. Serve responsive derivative sizes, lazy-load below-the-fold media, and prioritize only the public hero asset needed for initial rendering. Heavy previews never block listing text, evidence, deal options or access controls. Project-page LCP target remains below 2.5 seconds under the [performance measurement contract](OBSERVABILITY.md); Phase 0 records no measured result.

Gallery controls support keyboard operation, visible focus, labelled previous/next buttons and zoom/dismiss without focus traps. Provide captions/transcripts and a text product explanation so motion or an external embed is not the only evidence of capability. Respect reduced motion and avoid automatic carousels; touch targets and small-screen behavior follow the [design system](DESIGN_SYSTEM.md).

| Condition | Required experience |
|---|---|
| Processing or scan pending | Owner sees progress/status; buyers receive no pending bytes |
| Scan/render failure | Owner gets a safe reason and replace/retry action; never render the original as fallback |
| Missing/removed external demo | Preserve permitted description/static media and offer reporting; no fake successful availability |
| Embed blocked, offline or provider outage | Static poster and explicit external link when permitted |
| Permission denied/revoked | Remove protected media and cached viewer state; do not reveal filenames or hidden counts |
| Draft preview | Clearly labelled unpublished audience simulation, with readiness issues and a route back to editing |

## Ownership and acceptance gates

Projects owns the preview manifest and publication decision; Documents owns secure bytes/scanning/delivery; Moderation owns review decisions; UI consumes authorized DTOs. `ProjectPreview` references versions and never stores an arbitrary executable bundle. Outbox publication/removal consumers are idempotent and recheck the current revision so an old publish event cannot resurrect withdrawn media. Every upload, review, publication and removal has authorized audit/provenance.

Phase 3 acceptance covers hostile/mislabelled files, metadata removal, oversized media, transcode outage, draft/public leakage, unauthorized audience preview, keyboard/screen-reader use, reduced motion, mobile layout and publish/unpublish event ordering. Optional embedded demos add sandbox escape/navigation/message-origin and privacy tests before enabling a provider. Phase 8 tests private media revocation and NDA expiry. Phase 15 measures cache removal, page performance, external-content incident response and security assessment. Hosting or executing seller code requires a future explicit scope change and architecture review; it is absent from this baseline.
