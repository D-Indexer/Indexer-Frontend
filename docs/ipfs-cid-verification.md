# IPFS CID verification states

Gateway JSON is exposed with `hash-verified` only when the browser can recompute the raw CIDv1 digest. CIDv0 and dag-pb UnixFS content is explicitly `unverified` rather than presented as verified, because a browser must fetch and validate every raw block and reassemble the DAG before it can make that claim.

`fetchJsonWithVerification` returns `{ value, verification }` for public views. A future trustless gateway implementation can upgrade CIDv0/dag-pb to `hash-verified` without changing this disclosure API. Tampered raw CIDv1 bytes reject before JSON parsing.
