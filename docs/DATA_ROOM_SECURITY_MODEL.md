# Virtual data-room security model

Status: Phase 0 architecture freeze. Source: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md), sections 23–26, 29, 35 and 101. This specifies controls to implement in phases 3, 6 and 8 onward. It does not claim that a secure room currently exists. Related: [authorization](RBAC_ABAC_MATRIX.md), [security](SECURITY_MODEL.md), [data model](DATA_MODEL.md).

## Ownership and security boundary

Data Room owns room structure, folders and viewer groups. Documents owns immutable document versions, document access policy and access-event records. Projects, Messaging, Verification, Diligence, NDA and Agreements reference document/version IDs through the Documents module interface; they cannot sign arbitrary storage keys. A room belongs to a project owner and exactly one deal. Owner preparation before a deal uses private Documents records outside a room; attaching them to a deal room requires an explicit scoped policy. Separate deal rooms and named grants prevent one buyer seeing another buyer's diligence. Organization ownership is distinct from the organizations represented by permitted participants.

| Concept | Required attributes and invariant |
|---|---|
| DataRoom | Project, required deal, owner principal, lifecycle, policy revision; no public bucket |
| DataRoomFolder | Room, parent, category, inherited policy; acyclic and same-room parent |
| Document | Optional room/folder, owner/uploader, purpose, title, classification, current version, archive state; metadata itself authorized |
| DocumentVersion | Monotonic version, immutable random object key and storage version ID, digest, bytes, detected MIME, uploader, scan result/version/time, rendering status; replace by new version only |
| DocumentAccessPolicy | Category, allowed principals/groups, action permissions, NDA requirement, expiry, watermark, download, jurisdiction, restricted-view requirement, policy revision |
| ViewerGroup / ViewerGroupMember | Explicit group scope and named membership; active organizational membership is still checked |
| AccessGrant | Owner decision, requester/represented principal, project/deal/categories, purpose, expiry/revocation and policy revision; never a global buyer clearance |
| DocumentAccessEvent | Actor, operation, policy decision/version, document/version, timestamp, request/trace ID, outcome and delivery evidence where available; append-only |
| RetentionPolicy / LegalHold | Data category, jurisdiction, lawful basis, expiry clock and hold authority; a hold blocks deletion without granting view permission |

Folder inheritance can only narrow access automatically. A broader child grant requires an explicit owner-approved policy change and review of all inherited restrictions. Moving a document cannot lower its classification or remove its NDA requirement. Viewer group changes invalidate policy caches; joining an organization does not silently join all buyer groups. Signed legal versions remain exact immutable originals, regardless of later presentation versions.

## Private object architecture

Use separate private storage boundaries for upload quarantine, clean original documents, safe rendered derivatives, signed legal records/audit archives and KYC. Enable S3 Block Public Access, deny non-TLS requests, require KMS encryption and use least-privilege task IAM roles. Object paths contain opaque identifiers, never customer names or filenames. Buckets, KMS keys and IAM roles are environment-specific. Public project screenshots use a separately approved derivative publication path; original private uploads never become public by changing ACLs.

The API stores metadata in PostgreSQL; S3 stores bytes. The browser never supplies a trusted bucket/key or obtains general credentials. Upload/download tokens bind the exact document version, operation and expiry. VDR bytes never enter the public CloudFront cache. CloudFront may serve public media; restricted viewing uses a separately configured authenticated gateway with caching disabled.

## Upload, scanning and publication

1. Authorize uploader, project/deal, category, quota and allowed content class. Create a pending version and one-use upload intent with exact random quarantine key, expected size, MIME declaration, checksum and short expiry. Initial design limits ordinary documents to 100 MiB and a signed upload intent to five minutes; larger diligence packages require a separately reviewed bounded multipart workflow.
2. Issue a constrained signed upload policy for that key and allowed byte range. Browser claims never determine clean status. Finalization checks actual object existence, version ID, size, digest and declared versus detected type; reject mismatches and replayed intents. Never overwrite a clean key.
3. A durable storage/finalization event schedules a scan idempotently by document version. Scan in an isolated, resource-limited worker with no application credentials or unrestricted egress. Detect MIME/magic bytes, malware, embedded executable/active content, archive recursion, decompression bombs and invalid structures. Password-protected content that cannot be inspected remains quarantined pending an approved alternative evidence process.
4. Version scan states are `PENDING`, `SCANNING`, `CLEAN`, `INFECTED`, `ERROR`. Only `CLEAN` may be viewed or used by AI. Timeouts, provider outages and unknown results fail closed; retries never mark a file clean by exhaustion. Record scanner engine/signature versions for rescan campaigns.
5. Copy verified bytes to an immutable clean object key/version after scanning. Render safe derivatives in a separate sandbox; remove active scripts, embedded links/forms and metadata not intended for disclosure. Rendering success does not bypass original scan requirements. Default unsupported formats to controlled download when policy permits; do not serve active HTML/SVG inline on the application origin.
6. Recheck uploader ownership/policy before activating the version, then commit metadata + audit + outbox event atomically. Notify recipients with a safe in-app link. Garbage-collect abandoned quarantine objects by bounded retention policy; quarantine evidence needed by a case is held separately.

Permissions to upload, review, view and download are independent. Attachment links in messaging and diligence always resolve through the document module. A clean scan is one control, not a promise that content is safe or truthful.

## Access decision and delivery

For an external viewer, `CanViewDocument = A AND M AND P AND G AND N AND J AND R AND version.CLEAN`, using [authorization predicates](RBAC_ABAC_MATRIX.md). Owner maintenance is a separate scoped policy. Platform access requires an assigned case and staff authorization; KYC uses its own vault. Evaluate room, folder, document, current version, viewer group, explicit denies, expiration, NDA signers/hash and membership on each request. Absence of a policy denies.

| Mode | Delivery | Revocation and evidence |
|---|---|---|
| Download allowed | Authorize and audit intent, then issue a signed GET for an exact clean version, maximum 60 seconds, safe attachment filename and `Cache-Control: private, no-store` | New URL issuance stops immediately after policy revocation; already-issued URL can start new requests until expiry; storage access logs supplement issuance audit |
| Download disabled | Authenticated gateway delivers a watermarked, safe per-page derivative after checking current policy on every page request; never sends original object URL/full PDF | New page requests deny after revocation; close viewer sessions and clear UI caches best-effort; already delivered pages cannot be recalled |
| Restricted diligence | Same gateway plus fresh MFA, named scope and limited page/session lifetime; source access may instead be an owner-controlled temporary repository grant | Each operation rechecks grant and repository scope; disconnect/removal scheduled and confirmed with provider |
| Signed legal record | Original signed bytes retained under record policy; exact signers or lawful case viewers may download when permitted | Digest and provider evidence preserved; access remains separate from retention |

S3 presigned URLs are bearer capabilities, may be reused during validity, and expiry is evaluated at request start: an in-flight transfer can continue after expiry. The 60-second limit therefore bounds **new-request capability**, not all bytes in transit. The gateway is required when a policy cannot accept that residual window. Watermarks and disabled downloads deter misuse; they cannot prevent screenshots or copying information already disclosed. [AWS presigned URL semantics](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)

Enforce the 60-second download design through signer configuration and a scoped `s3:signatureAge` bucket policy; monitor clock drift and validate timing in staging. Do not claim a presigned URL is one-time use. Gateway requests require session authentication and are never redirected to an original signed URL. Watermarks identify viewer, deal/document/version and UTC access time using a pseudonymous viewer reference where possible; their identifiers do not expose unrelated PII.

## Revocation, sharing and concurrency

Revocation increments the policy/grant revision in the same transaction as its audit/outbox event. New API capabilities use committed policy, not an eventual Redis grant cache. Read-time checks compare current revision. Membership removal, NDA expiry/void, project suspension, compliance hold and deal participant removal trigger the same invalidation mechanism. Realtime channels are closed; queued notifications and AI results reauthorize at delivery time.

Downloads issued concurrently with revocation are serialized against the relevant policy row/version before signing. Absolute ordering between a database commit and already-delivered browser bytes is not possible; the above residual model is the explicit guarantee. Emergency storage/IAM denial can stop further storage access but may affect multiple users and must be controlled by incident response.

No anonymous sharing links in initial phases. An invitation creates a pending named principal, not access. Recipients authenticate, accept membership/participation, satisfy the NDA and receive their own grants. Exports have a separate permission, manifest of included versions, TTL, watermark and audit; export jobs recheck every member document before release. One unreadable file cannot be silently smuggled into a folder ZIP.

## Retention, legal hold and permanent record

Keep a permanent auditable reference to a completed deal: stable deal/event/version IDs, non-secret digests, legal record references and disposition history. That is not a requirement to retain all personal data, KYC files, transcripts or source copies forever. Personal content is retained only for a documented purpose and jurisdiction-specific schedule; counsel-approved production schedules and disclosure terms are phase 15 launch gates. Sandbox uses synthetic evidence and bounded cleanup.

Deletion archives the application resource first and evaluates all policies/holds before physical removal. A hold includes reason, authority, scope and review date; release requires an independently authorized decision and audit. Account deletion cannot cascade-delete signed records or active held evidence. If lawful erasure is required, retain a minimal non-personal tombstone/reference and remove accessible personal content subject to the approved schedule; treat linkable hashes/IDs as potentially personal data in the assessment.

Use S3 Object Lock on selected immutable legal/audit archives after schedules and restore procedures are validated; do not indiscriminately lock every uploaded document forever. AWS distinguishes retention modes and legal holds; compliance-mode protection cannot be shortened even by root, so production settings require an approved retention design before application. [AWS Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)

Backups follow the retention policy and restoration process replays deletion/hold records before reopening access. Loss of an object, digest mismatch or policy-record corruption is a security incident; fail closed and preserve evidence. Audit delivery is durable before a new sensitive capability is issued; audit storage failure blocks disclosure, with a user-safe retry response.

## Audit and verification requirements

Record upload/finalize/scan, version creation, view authorization, gateway page delivery, download authorization, observed object download, share/invite, permission change, denial, expiry, archive, purge, hold and hold release. Distinguish an authorized URL from a completed download; storage logs cannot establish that a human read a page. Never log signed URLs, raw document content, secret filenames or KYC payloads in ordinary logs.

Phase 3 requires secure media quarantine before listing uploads. Phase 6 requires grant/policy/audit infrastructure. Phase 8 requires VDR tests for category and tenant isolation, missing/expired NDA, removed group/member, direct object access, upload overwrite/replay, archive bombs, scan outage, digest tampering, raw-original leakage from restricted viewer, nested folder moves, concurrent revocation, signed URL expiry, held deletion and AI/export leakage. Phase 15 adds external security assessment, restore/deletion drills, large-room load tests and production retention evidence. See [E2E matrix](E2E_TEST_MATRIX.md) and [threat model](THREAT_MODEL.md).
