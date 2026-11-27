# Verification proof bundle (v1)

The public portfolio page offers **Download proof** for portfolios that verified on-chain. The file
(`<folder>.proof.json`) is generated in the browser and lets anyone re-check the portfolio later, even if
this site is gone.

```json
{
  "version": 1,
  "appVersion": "0.1.0",
  "fetchedAt": "2026-11-25T10:00:00.000Z",
  "folder": "jane.folder",
  "owner": "G...",
  "contract": "C...",
  "networkPassphrase": "Test SDF Network ; September 2015",
  "cid": "bafkrei...",
  "contentBase64": "<exact IPFS bytes, base64>",
  "liveUntilLedger": 1234567,
  "latestLedger": 1200000,
  "rpcResponse": {
    "verify_portfolio": true,
    "get_portfolio": { "ipfsCid": "bafkrei...", "templateId": 1, "mintedAt": 1100000 }
  }
}
```

| Field | Meaning |
| --- | --- |
| `version` | Schema version. Readers must reject versions they do not know. |
| `contentBase64` | The exact bytes served for `cid`, so the hash can be recomputed. |
| `liveUntilLedger` | TTL of the contract instance at `latestLedger` (`null` if the RPC could not say). |
| `rpcResponse` | What the read-only `verify_portfolio` / `get_portfolio` simulations returned. |

## Verifying

`verifyProofBundle(bundle)` in `src/features/public-portfolio/proofBundle.ts` is pure (no network). It checks the
version and required fields, that `verify_portfolio` was true, that `cid` equals the recorded `get_portfolio` CID, and
that SHA-256 of the decoded content reproduces the raw CIDv1. It returns `{ valid, errors }`. To confirm the CID is
still the current one, call `get_portfolio(owner)` on `contract` yourself.

Changing the schema requires a new `version` and a new section here.
