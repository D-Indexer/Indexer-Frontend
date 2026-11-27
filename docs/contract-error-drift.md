# Contract error map drift check

Pin `contract.lock.json` to an immutable Indexer-Contract commit whenever the contract releases. `node scripts/check-contract-errors.mjs` is intended for CI: it reports the local error-code map and skips only while the lock remains deliberately unpinned. A pinned implementation should fetch `src/errors.rs` and fail on missing, extra, or renumbered `ContractError` variants.

Wallet-returned signed XDR is hash-compared against the prepared transaction before submission. A mismatch or unexpected fee bump raises `WalletError('tampered')` and no network submission occurs.
