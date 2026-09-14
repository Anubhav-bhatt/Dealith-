# ADR-010: Crypto is a disabled future provider rail

Status: Recorded baseline, 2026-09-07; disabled in initial execution. Sources: master §§8–9, 36, 75, 93, 96.

## Context and decision

Crypto may later be an adapter under the settlement interface. Dealith never stores seed phrases/private keys, implements custody/signing wallets, maintains spendable trading balances, launches an exchange/token or builds a blockchain. Initial sandbox and commercial execution use fiat. The server crypto flag defaults false and is only one input to provider, asset/network, jurisdiction, eligibility and compliance gates.

Future enablement requires a separate ADR with exact provider/asset/network/precision/finality, screening, destination approval, refund/dispute, idempotency, signed evidence and reconciliation contracts. Provider custody design and required obligations must be evaluated for that corridor; the architectural boundary is not a conclusion about legality. Blockchain transaction hashes and client wallet returns are observations, not automatic deal completion. See [crypto boundary](../CRYPTO_BOUNDARY.md).

## Alternatives and consequences

Adding native wallet custody conflicts with the master exclusions and materially enlarges key/financial exposure. Pretending fiat and crypto amounts are interchangeable loses chain, finality and refund semantics. Keeping the rail disabled avoids making unsupported availability promises while preserving an integration seam.

## Verification and revisit

Initial release tests reject client/flag-based attempts to invoke crypto. Before later enablement test wrong chain/token, precision, under/overpayment, changed destination, stale screening/quote, replay, reorganization, dropped/replaced transactions, provider outage and unsupported refund. An investor intent or subscription never overrides disabled capability.
