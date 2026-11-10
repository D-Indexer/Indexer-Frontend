# Architecture

```
Browser (this repo)
  ├─ Freighter ── signs transactions
  ├─ Soroban RPC ── simulate / submit / poll; read-only verify_portfolio, get_portfolio
  ├─ Indexer-Backend ── GET /folders, /portfolios, /templates; POST /upload (pins to IPFS)
  └─ IPFS gateway ── reads portfolio and template JSON (verified against the CID)
```

## Layers

| Layer | Responsibility |
| --- | --- |
| `src/main.tsx` | Renders `ConfigErrorScreen` if `envErrors` is non-empty, otherwise the router and `App`. |
| `src/config/env.ts` | Parses and validates `VITE_*` variables (pure `parseEnv`, unit-tested). |
| `src/services/data/folderData.ts` | The only read path for Folder data: backend + IPFS, or demo fixtures when `VITE_DEMO_MODE=true`. Errors propagate. |
| `src/services/stellar/stellarService.ts` | Contract calls: build → simulate → `assembleTransaction` → sign → `sendTransaction` → `pollTransaction`. Read-only calls use simulation. |
| `src/services/stellar/freighterWallet.ts` | Freighter wrapper with typed errors. |
| `src/services/stellar/contractErrors.ts` | `ContractError` code → message mapping. |
| `src/services/ipfs/` | Backend upload, gateway reads, contract CID rules, raw CIDv1 computation. |
| `src/store/walletStore.ts` | Wallet state (address, network, status). |
| `src/features/*` | Wallet button and gate, folder overview and claim form, portfolio form, transaction status, public page and template layouts. |

## Trust model

- The **contract** is the source of truth. The public page loads content by the CID returned from
  `get_portfolio` and shows "Verified on Stellar" only when `verify_portfolio` returns true.
- The **indexer** is a cache used to find folders by name or owner. If it lags behind the chain, the
  on-chain CID wins.
- **IPFS content** is hashed and compared with its CID whenever the CID is a raw CIDv1 (what the
  backend produces for single-block files).
- The browser holds no secrets; uploads go through the backend.

## Decisions

See [docs/adr/](adr/).
