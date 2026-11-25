# Folder contract state, identity, receipts, and events

The public portfolio reader retains the existing `verify_portfolio` / `get_portfolio` simulation path as a compatibility fallback until the deployed `DataKey::Portfolio(Address)` XDR layout is pinned from Indexer-Contract. The state result shape reserves `liveUntilLedgerSeq` for the direct `getLedgerEntries` path.

Set `VITE_FOLDER_CONTRACT_WASM_HASH` to the 64-hex hash pinned in Indexer-Contract's testnet deployment manifest. A mismatch must block writes while leaving read-only portfolio data visible and labelled.

Folder event receipts recognize `folder_cl`, `port_mint`, and `port_upd`; events outside those typed shapes are not rendered as confirmations. Dashboard event polling is visibility-aware and must start from a retained RPC cursor; older events can be unavailable under RPC retention policies.
