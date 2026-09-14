# Repository integration

Status: Phase 0 architecture baseline, 2026-09-07. Phase 7 implements approved repository adapters and derived technical intelligence. GitHub, GitLab and Bitbucket are the planned provider family, not a claim that all are implemented or enabled. Authority: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md), §27. Related: [AI architecture](AI_ARCHITECTURE.md), [data model](DATA_MODEL.md), [authorization](RBAC_ABAC_MATRIX.md), [project previews](PROJECT_PREVIEW_ARCHITECTURE.md).

## Connection and disclosure are separate permissions

Intelligence owns `RepositoryConnection` and `RepositoryAnalysis`. A connection binds one project, the connecting authorized user/organization, provider installation/account/repository identifiers, consented capability level and revocation/version. Tokens are encrypted in the secret store and referenced by identifier; neither the browser DTO nor ordinary logs receive tokens. Connecting a repository is evidence of delegated access at a point in time, not proof of IP ownership, contractual transferability, business quality or security.

The first enabled adapter starts with selected repositories and the least read scope that supports metadata-only analysis. Owner selection never silently means every repository in an organization. Additional access needs an explicit scope explanation, owner action and fresh policy validation. Provider account control does not establish `Project` ownership: ownership verification and repository evidence remain separate.

| Level | Permitted collection | Buyer disclosure and gate |
|---|---|---|
| Metadata baseline | Repository identity/age, provider-supported language/activity/release summaries and safe owner-selected metadata | Reviewable derived claims only; private names/URLs/contributor identities excluded from public DTO |
| Selected file inspection | Read-only bounded files needed for documentation, dependency manifest, test/CI configuration presence and structure signals | Separate owner consent and additional provider permissions; raw file content never part of the default buyer result |
| Authorized security evidence | Specific alert/scan summaries where the provider and owner permit them | Separate security permission and restricted classification; no broad account-security scope for ordinary listing analysis |
| Restricted source diligence | Exact named repository/ref or approved source evidence through a time-bound process | `RESTRICTED_DILIGENCE`, named technical participant, owner grant, current NDA and fresh step-up; source access is never inferred from viewing a technical score |

These are Dealith capabilities, not claims of identical provider permission names. Before enabling an adapter, maintain a capability-to-endpoint-to-permission matrix, supported account types, retention behavior and contract fixtures. Where the provider cannot expose a signal at the granted level, return unavailable and explain the additional consent; do not silently widen scope or substitute a fabricated value. GitHub documents selecting app permissions against the APIs/events needed and reviewing requested permissions; the exact integration grant must be tested against the chosen endpoints. [GitHub App permission guidance](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)

## Provider port and connection lifecycle

The repository port exposes capability discovery, delegated connection initiation/completion, selected repository discovery, metadata read, bounded file read when allowed, analysis snapshot read, revocation and provider-event verification. It has no commit, push, branch creation, deployment, organization administration or membership-grant operation. Phase 12 ownership handover is an independently governed `AssetTransferItem`; the intelligence connector does not acquire write privileges to perform it.

1. Authorize project maintenance and connecting principal. Create an expiring, single-use callback correlation bound to actor/session, provider, project and requested scope. Use the provider's reviewed delegated authorization mechanism, CSRF state and PKCE where that flow supports/requires it. Redirect targets are allowlisted; callback data cannot choose a different project.
2. Validate returned provider identity, account/installation and selected repositories server-side. Recheck project ownership and actual granted capabilities. Store references and encrypted credential material; record consent and audit. Never accept a pasted token as the default onboarding path.
3. Queue a bounded analysis referencing the exact connection version, authorized level and repository/ref. API clients receive safe status and last-analysis metadata, not unrestricted provider responses.
4. At execution and result publication, revalidate connection, granted capabilities, principal/project ownership and processing purpose. Tokens that have expired, been narrowed or revoked cannot be resurrected from a queued job.
5. Explicit disconnect marks the connection revoked first, invalidates result disclosure, cancels queued processing and attempts provider token/grant revocation. Provider removal events do the same. Track provider cleanup until confirmed; local denial does not wait for the provider. A fresh reconnect is a new consent/version and does not revive old grants.

Callbacks and webhooks validate authenticity, provider account and environment before processing. Deduplicate deliveries and record safe event identifiers. Provider events indicate a need to refresh authoritative capability state; an old installation-added event cannot undo a later removal. Retry only bounded transient errors and respect provider limits. Unknown account state fails closed for new reads.

## Safe analysis and provenance

Treat every repository file as hostile content. Never run installation scripts, builds, tests, hooks, repository workflows, package managers, downloaded binaries or seller containers. Static file inspection uses bounded parsers in isolated workers with no application credentials and constrained egress. A declaration of test files or CI config proves presence only; Dealith does not label tests passing without independently permitted evidence. Do not follow symlinks outside the snapshot or fetch submodules, Git LFS objects, dependencies or linked resources automatically.

Default to provider API metadata and individually allowlisted text files. Enforce file-size, total-byte, file-count, recursion, parser-time and concurrent-job limits before enabling selected-file analysis. Reject path traversal, unexpected encodings, decompression bombs and binary payloads. If an archive is later necessary, its manifest/limits and quarantine follow [document security](DATA_ROOM_SECURITY_MODEL.md); it is never unpacked into the application runtime. Exact numeric analysis limits are adapter-specific Phase 7 configuration gates with resource-exhaustion fixtures.

`RepositoryAnalysis` is an immutable snapshot with connection/ref/commit hash, source scope, analyzer/schema version, observation time, expiry, derived signals, evidence references, coverage and confidence. Record whether a signal came from provider metadata, static inspection or owner assertion. An unavailable commit identifier must be explicitly recorded with the weaker provenance; do not imply snapshot consistency across moving branches.

| Signal family | Required interpretation |
|---|---|
| Language mix, repository age and recent activity | Source period and coverage; activity alone is not quality or ownership |
| Contributors and release cadence | Aggregate rather than expose private identities; define observation window and bot handling |
| Tests, CI/CD, documentation and project structure | Presence and inspected coverage; no claim of passing tests or functioning deployment |
| Dependency health and security alerts | Tool/data version, inspected manifests, applicable permissions and gaps; absence of an alert is not absence of vulnerabilities |
| Architecture, maintainability, scalability and debt | Evidence-linked reviewer/model observations, clearly distinct from verified facts |
| Ownership/operational maturity signals | Limited corroboration with source and confidence; never independent title or transferability certification |

Derived output undergoes secret/PII and disclosure review before use. Raw source fragments, paths, private repository names, contributor email addresses and detailed vulnerabilities stay restricted unless a specific policy permits release. Public technical summaries must be separately owner-approved safe representations in a reviewed `ProjectRevision`. Publication follows the normal listing review and policy checks; background recomputation cannot silently alter a published claim. A source-owner consent change blocks new use and marks dependent claims stale pending revalidation; historical minimum evidence follows retention/hold policy.

`ProjectScore` remains Projects-owned; Intelligence submits provenance-bearing inputs through its public interface. Scores preserve policy version, confidence, timestamp and missing-data coverage. AI explanation is optional and obeys [AI privacy and source authorization](AI_ARCHITECTURE.md). Selecting an AI provider is an additional processing decision, not a consequence of repository connection.

## Restricted source access and transfer

Initial buyer source review uses either owner-managed temporary provider access or immutable, approved source evidence under data-room controls. The former cannot be claimed instantly revoked by Dealith unless the provider confirms removal; until then, show removal pending to authorized owners/operators while all Dealith reads deny. Any provider invitation/reference is bound to the intended recipient and expiry, audited, and reconfirmed by the owner/provider. No anonymous source share or source mirror in a public bucket.

Source inspection does not transfer repository ownership. A completed acquisition's transfer evidence records source repository identity, agreed revision/reference, intended recipient and confirmation without keeping reusable credentials. Subsequent buyer use of an intelligence connector requires their own authority and consent. Seller tokens are never passed to the buyer. See [offer, diligence and transfer model](OFFER_DILIGENCE_TRANSFER_MODEL.md).

## Reliability and acceptance

Connection denial/revocation, provider outage, rate limit, moved/deleted repository, absent permission and incomplete analysis are distinct user-safe outcomes. Retain the last permitted snapshot with a clear observation date and stale/unavailable label when policy allows; otherwise withhold it. Neither outage nor opt-out becomes a negative technical-quality score. Duplicate job/event deliveries do not create duplicate active snapshots for the same connection/ref/analyzer/input scope; refreshed snapshots retain lineage.

Phase 7 acceptance requires actual adapter permission-matrix evidence, metadata-only positive control, denied extra scope, cross-project callback substitution, nonce replay, token redaction, queued revocation, provider uninstall/reconnect ordering, private-source leakage checks, parser abuse limits and expired/stale evidence behavior. Test the same contract for each additional provider before enabling it. Phase 8 adds restricted-source/NDA tests; Phase 10 adds diligence evidence lineage; Phase 12 tests transfer separation. Phase 15 validates provider contracts, deletion/revocation operations and security review. These are pending implementation gates, not claims of executed tests.
