# Folder Frontend

[![CI](https://github.com/D-Indexer/Indexer-Frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/D-Indexer/Indexer-Frontend/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Folder is a decentralized portfolio tool on Stellar. You claim a folder name (`jane.folder`), pick a
template, and mint a portfolio NFT whose content lives on IPFS. Anyone can open
`/p/jane.folder` and check it against the Folder Soroban contract. This repository is the React +
TypeScript + Vite web app. It connects to [Freighter](https://www.freighter.app/), builds and
submits the contract transactions, uploads content through
[Indexer-Backend](https://github.com/D-Indexer/Indexer-Backend), and renders public, verifiable
portfolio pages.

<!-- TODO: replace with a GIF of connect → claim → mint → /p/<name>.folder (docs/assets/demo.gif) -->
> 📸 _Screenshot / GIF placeholder: claim → mint → public page._

## Status

| Area | Status | Notes |
| --- | --- | --- |
| Freighter connect / disconnect, address display | ✅ | Restores a previous session and watches for account or network switches. |
| Testnet enforcement | ✅ | On-chain actions are blocked with a message when the wallet is not on Testnet. |
| `claim_folder`, `mint_portfolio`, `update_portfolio` | ✅ | Build → simulate → prepare → Freighter sign → submit → poll, with the tx hash linked to stellar.expert. The same pipeline is exercised against the deployed contract by an opt-in integration test (signing with a local key instead of Freighter). |
| Contract error messages | ✅ | All 19 `ContractError` codes from Indexer-Contract `src/errors.rs`. |
| Portfolio content upload via backend | 🟡 | The frontend sends JSON to the backend's `POST /upload` and checks the returned CID. **Indexer-Backend currently accepts only JPEG/PNG/WebP/PDF uploads, so it rejects the portfolio JSON**; the UI explains this. Minting from the UI needs that backend change. |
| Public page `/p/:folderName` + "Verified on Stellar" | 🟡 | Uses `verify_portfolio` / `get_portfolio` on-chain and loads the content from IPFS by the on-chain CID. The contract reads are exercised against testnet by the integration test, and the page has component tests. It has not been run end to end against a live Indexer-Backend yet. |
| Loading / empty / error states, demo mode | ✅ | No silent fixture fallback. Fixtures only with `VITE_DEMO_MODE=true`, behind a visible banner. |
| Config validation | ✅ | Missing or invalid `VITE_*` variables render an error screen. |
| Accessibility of the main flow | ✅ | Labels, inline errors, focus management, axe checks in tests. Not yet audited with a screen reader. |
| CI (typecheck, lint, test, build) | ✅ | `.github/workflows/ci.yml` |
| More templates, other wallets, i18n, edit history, OG images, mobile layout, Playwright E2E | ⬜ | Tracked as [issues](https://github.com/D-Indexer/Indexer-Frontend/issues). |

## Testnet deployment

| | |
| --- | --- |
| Network | Stellar testnet (`Test SDF Network ; September 2015`) |
| Folder contract | [`CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV`](https://stellar.expert/explorer/testnet/contract/CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV) |
| Source | [Indexer-Contract `deployments/testnet.json`](https://github.com/D-Indexer/Indexer-Contract/blob/main/deployments/testnet.json) |

## Quick start

Requirements: Node.js 20+, and the [Freighter](https://www.freighter.app/) extension set to
**Testnet** with a [Friendbot](https://friendbot.stellar.org)-funded account.

### Option A: with the backend (real data)

```bash
# 1. Backend: Postgres + IPFS (Kubo) + API + indexer, pointed at the testnet contract
git clone https://github.com/D-Indexer/Indexer-Backend
cd Indexer-Backend && docker compose up --build    # API on http://localhost:3000

# 2. Frontend
git clone https://github.com/D-Indexer/Indexer-Frontend
cd Indexer-Frontend
cp .env.example .env    # defaults point at localhost:3000 and the testnet contract
npm ci
npm run dev             # http://localhost:5173
```

Tip: set `VITE_IPFS_GATEWAY_URL=http://localhost:8080/ipfs` to read content from the backend's
local Kubo node instead of a public gateway.

### Option B: demo mode (no backend, no wallet)

```bash
npm ci
VITE_DEMO_MODE=true npm run dev
```

Demo mode serves bundled fixtures (try `/p/demo.folder`), shows a persistent "Demo data" banner,
and disables on-chain actions.

### Scripts

```bash
npm run dev         # Vite dev server on :5173
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm test            # Vitest + Testing Library
npm run build       # production build in dist/

# Optional: run claim → mint → update → verify against the testnet contract
FOLDER_TESTNET_SMOKE=1 npx vitest run src/services/stellar/testnet
```

Every `VITE_*` variable is documented in [docs/configuration.md](docs/configuration.md).

## How it works

1. **Claim**: `claim_folder(owner, "<name>.folder")`. Names follow the contract's rules (3+
   `[a-z0-9-]` before `.folder`, at most 64 characters), checked in the form before signing.
2. **Mint**: the portfolio JSON is uploaded through the backend's `/upload` endpoint (no IPFS
   credentials in the browser). The returned CID must match the contract's CID rules and the
   SHA-256 of the uploaded bytes, and is then anchored with `mint_portfolio(owner, template_id, cid)`.
3. **Update**: same as mint, using `update_portfolio(owner, cid)`.
4. **Verify**: `/p/<name>.folder` resolves the owner through the indexer, calls `verify_portfolio`
   and `get_portfolio` on-chain, and renders the IPFS content with its template.

See [docs/architecture.md](docs/architecture.md) for the module layout.

## Related repositories

- [Indexer-Contract](https://github.com/D-Indexer/Indexer-Contract): Soroban contract (Rust)
- [Indexer-Backend](https://github.com/D-Indexer/Indexer-Backend): API, indexer and IPFS uploads

## Contributing

Issues labelled [`good first issue`](https://github.com/D-Indexer/Indexer-Frontend/labels/good%20first%20issue)
are a good place to start. Read [CONTRIBUTING.md](CONTRIBUTING.md), then open a PR. CI must pass
(typecheck, lint, test, build). The browser bundle is public, so never add secrets to `VITE_*`
variables.

## License

[MIT](LICENSE)
