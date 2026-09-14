# ADR-005: Private S3 object storage

Status: Recorded baseline, 2026-09-07. Sources: master §§26, 45–49, 74, 93. Safe upload kernel begins PHASE-03.

## Context and decision

Use S3 with KMS encryption, Block Public Access, object versioning, scoped task roles and environment isolation. Separate quarantine, clean originals, safe derivatives, signed legal/audit archives and KYC by buckets or equivalently enforced IAM boundaries. PostgreSQL owns metadata, policy and immutable object-version/digest references. Opaque keys cannot contain personal filenames. Only explicitly approved public media derivatives enter the public delivery path.

Upload finalization verifies exact key/version, size, digest and content type. A scan failure stays quarantined. Object paths and bucket names supplied by browsers are never trusted authority. Signed downloads bind one authorized clean version with a maximum 60-second new-request lifetime; restricted view uses the authenticated gateway specified in [document security](../DATA_ROOM_SECURITY_MODEL.md). Lifecycle/hold rules and restore manifests govern deletion. Selected Object Lock archives require an approved retention design before production configuration.

## Alternatives and consequences

Database blobs enlarge transactional backup costs; a public object bucket leaks confidential originals. A single undifferentiated bucket/role makes quarantine and KYC separation fragile. Private storage still needs policy checks and audits: encryption and difficult-to-guess keys do not authorize reads. Signed URL expiry cannot recall bytes already delivered or terminate all in-flight transfers.

## Verification and revisit

PHASE-03 proves quarantine and safe derivative publication; PHASE-08 proves raw-object denial, signed expiry, gateway revocation, legal holds and object integrity. AWS sandbox parity tests validate IAM/KMS/signing semantics beyond local emulators. PHASE-15 measures object/database restore consistency and retention controls; region/account choices remain gated configuration.
