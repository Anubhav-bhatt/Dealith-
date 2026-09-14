# ADR-012: Classified and revocable document access

Status: Recorded baseline, 2026-09-07. Sources: master §§23–29, 45–47, 93. PHASE-03 safe media kernel; PHASE-08 full VDR.

## Context and decision

All files use the document service: listing uploads, message attachments, verification evidence, diligence, agreements and exports. Private immutable versions progress through quarantine and scanning before any permitted viewing or AI use. Authorization checks classification, current principal/participation, explicit grant, purpose, NDA version/expiry, owner policy, risk/jurisdiction, clean version and deny rules before serialization or delivery. Retention permission is distinct from view permission.

Download-allowed access uses an exact-version signed URL with at most 60 seconds for starting new requests; in-flight transfer may continue and delivered bytes cannot be recalled. Download-disabled access uses an authenticated, per-page policy-checked gateway with safe watermarked derivatives, never the original URL/PDF. Watermarks deter misuse but cannot prevent screenshots. Revocation stops subsequent authorization and queued/export/AI disclosure; it is not a promise to erase recipient knowledge. See [data-room security](../DATA_ROOM_SECURITY_MODEL.md).

## Alternatives and consequences

Anonymous share links, public storage or folder membership alone cannot support NDA/tenant controls. Rendering the full original in a browser while hiding a download button does not enforce the no-download contract. Gateway delivery increases cost and format constraints; scan/render errors fail closed and need useful retry/review UX. Legal holds block purge without adding viewers; production schedules require actual qualified review.

## Verification and revisit

PHASE-03 proves safe upload before media ships; PHASE-06 prevents attachments bypassing confidentiality; PHASE-08 proves malware/error/quarantine, upload replay, tenant/category isolation, signed expiry, direct-original denial, folder moves, concurrent revocation, held deletion and export/AI reauthorization. PHASE-15 proves backup/restored deletion and external assessment. A new format or sharing mode requires threat review and equivalent evidence.
