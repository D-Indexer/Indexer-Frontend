# Wallet authentication and IPFS verification

SEP-10 JWTs are held only in module memory, attached by the API client interceptor, and cleared on disconnect or account change. Configure `VITE_WEB_AUTH_ENDPOINT` and `VITE_WEB_AUTH_SIGNING_KEY`; the matching Indexer-Backend WEB_AUTH endpoint is required before owner-only routes can use it.

Freighter capability support requires current `getNetworkDetails` and address-aware `signTransaction`; users on older extensions should update from https://freighter.app.

Raw CIDv1 content is hash-verified. CIDv0 and dag-pb content is deliberately labelled `unverified` until a trustless block/DAG verifier is bundled, so gateway bytes are never presented as hash-verified.
