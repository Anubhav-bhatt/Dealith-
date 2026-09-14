# Crypto settlement boundary

Status: Phase 0 architecture freeze; future capability, disabled in V1. Source: [master scope](../DEALITH_MASTER_PROJECT_SCOPE.md), sections 8–9, 36, 75 and 96. This defines an architectural boundary, not legal clearance or a commitment to support any chain/asset/jurisdiction. See [settlement architecture](SETTLEMENT_ARCHITECTURE.md).

## Responsibility split

Crypto is a pluggable settlement rail behind the same provider-neutral Settlement port. V1 exercises fiat/escrow sandbox flows. Crypto enablement requires a later approved ADR and all production capability gates; `settlement.crypto.enabled` defaults false server-side in every environment until explicitly approved for a scoped provider, jurisdiction, asset and deal type. Public UI must not advertise unavailable rails as executable choices.

| Dealith owns | Approved provider owns |
|---|---|
| Deal/agreement and exact obligation metadata | Custody model, client wallet integration and any keys used by its service |
| Actor/organization authorization and consent | Deposit address creation or hosted wallet interaction |
| Jurisdiction/provider/asset capability gate and deterministic holds | Blockchain transaction construction, signing and broadcast |
| Stable operation IDs, signed webhook inbox and reconciliation | Required confirmations/finality rules and chain monitoring |
| Display of provider-issued amount/asset/network/expiry/fees | Provider execution, conversion if contracted, and held funds |
| Screened destination reference and approval history | Wallet/address screening and applicable provider KYC/AML controls |
| Transaction evidence and auditable local projections | Provider dispute/refund support and regulatory records it must maintain |

Dealith must never store private keys or seed phrases, implement a signing wallet, build an internal custodian, maintain user trading balances, run an exchange, issue a marketing token or build a blockchain. A user's self-custody interaction must occur with an approved provider/wallet interface; it does not authorize Dealith to request secrets. The platform's provider-based boundary is non-custodial for Dealith; it does not assert that every future provider itself is non-custodial.

## Transaction and screening contract

Before exposing a crypto instruction, the adapter must declare asset and chain identifiers, token contract/address when applicable, precision, minimum/maximum amount, confirmation/finality policy, expiry, fees, supported refund/dispute behavior, screening freshness and jurisdiction eligibility. Symbol alone is insufficient (`USDC` on two networks is not one payment destination). Store exact Decimal asset quantity with precision alongside agreed fiat value/quote where relevant; never compare crypto quantities as if they were fiat amounts.

Screening expectations are a procurement and compliance design: provider-supported origin/destination wallet checks, sanctions/risk indicators, rescreening before release, escalation of high-risk findings and evidence timestamps. Applicable KYC/AML, travel-rule and reporting obligations must be determined by qualified reviewers for the launch corridor and provider contract. Dealith does not infer legality or required checks from wallet software, nationality or an AI score. Unknown eligibility or screening failure blocks instruction/release.

A new wallet/destination version invalidates prior approval and requires the settlement destination controls. The client never chooses a final recipient or chain by editing request fields. Instructions display exact network, asset, quantity, beneficiary reference, fee/quote expiry and provider origin; mismatched/late/under/overpayments enter reconciliation and manual review rather than silent completion. Refunds use provider-verified instructions and current risk checks, never blindly trust an address copied from a message.

## Webhooks, finality and evidence

1. Reserve an authorized durable provider operation with stable idempotency before calling the provider.
2. Display provider-issued hosted instructions. Browser wallet success, transaction hash submission and redirect return are provisional evidence only.
3. Receive a signed authenticated provider webhook into the durable inbox; verify provider/account/environment/signature and correlate it to the exact settlement.
4. Fetch authoritative provider status, including chain, asset, quantity, transaction reference, destination, confirmations/finality and screening evidence. Reconcile against the agreement and existing financial records.
5. Apply normalized settlement evidence through domain commands and emit the same event family as other rails. Release and deal progression retain human authority and deterministic guards.
6. Treat reorganizations, replaced/dropped transactions and provider reversals as new evidence requiring a hold/reconciliation, not destructive rewriting of a prior transaction. Preserve the original observation and its correction reference.

Transaction evidence includes provider transaction ID, operation ID, chain/network ID, asset/contract, exact quantity, fees, timestamp, destination reference, transaction hash, block/finality evidence when available, screening decision reference, agreement version and source payload digest. A transaction hash may identify a public-chain observation but is not proof by itself of fulfillment of the agreed obligation or lawful provenance. Avoid putting identity, deal terms or documents on-chain.

## Enablement gates and tests

No crypto provider is selected in Phase 0. Later enablement requires verified provider support for the complete relevant settlement contract, regulatory and sanctions review, accepted jurisdictions/deal types, explicit customer disclosures, keys entirely outside Dealith, screened destinations, authenticated callbacks, exact precision handling, durable idempotency, reconciliation, dispute/refund procedures and on-call runbooks. If any capability is unavailable, the rail stays disabled; fiat does not depend on it.

Required future tests cover wrong chain/token, address substitution, stale quote/screening, precision overflow, duplicate/out-of-order callback, replay/wrong environment, chain reorganization, dropped/replaced transaction, under/overpayment, provider outage, unsupported refund, recipient change during pending release, and unauthorized feature flag enablement. AI and staff support tools receive neither keys nor money-moving authority.
