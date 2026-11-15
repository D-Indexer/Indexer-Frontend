# Release Checklist & Deployment Verification Guide

This checklist governs how a release candidate of **Folder Frontend** (`D-Indexer/Indexer-Frontend`) is versioned, verified against `Indexer-Contract` and `Indexer-Backend`, built, and validated post-deployment.

---

## 1. Pre-Release Cross-Repository Alignment

Because Folder Frontend coordinates directly with the Soroban smart contract (`Indexer-Contract`) and the indexing/IPFS upload service (`Indexer-Backend`), verify cross-repo compatibility before cutting a release:

- [ ] **Contract Deployment & Address Parity (`VITE_FOLDER_CONTRACT_ID`):**
  - Confirm that the target contract ID matches `deployments/testnet.json` in [`D-Indexer/Indexer-Contract`](https://github.com/D-Indexer/Indexer-Contract/blob/main/deployments/testnet.json) (currently `CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV` on Stellar Testnet).
  - Verify that `VITE_STELLAR_NETWORK` is set to `testnet` (validated by `parseEnv` in `src/config/env.ts`).
- [ ] **Contract Error Code Parity (`src/services/stellar/contractErrors.ts`):**
  - Confirm all `ContractError` variants in `Indexer-Contract/src/errors.rs` (codes `1`–`19`) are mapped in `src/services/stellar/contractErrors.ts`.
- [ ] **Template Metadata & CID Integrity (`src/data/knownTemplateMetadata.ts`):**
  - Confirm that bundled template metadata copies match the raw CIDv1 hashes registered on-chain (`cid.test.ts` reproduces the template CIDs registered on Testnet).
- [ ] **Indexer-Backend API Contract (`VITE_API_URL`):**
  - Verify compatibility with `GET /folders`, `GET /portfolios`, `GET /templates`, `GET /health`, and `POST /upload`.
  - Document any known upstream backend constraints in the release notes (e.g., if `POST /upload` MIME filtering has not yet enabled `application/json` portfolio payloads in the target backend environment).

---

## 2. Versioning & Branch Readiness

- [ ] **Clean `main` branch:** All PRs intended for the release are merged to `main`, and the GitHub Actions `CI` workflow (`.github/workflows/ci.yml`) is green on `HEAD`.
- [ ] **Semantic Versioning (`package.json`):**
  - Bump `"version"` in `package.json` (`PATCH` for bug/docs fixes, `MINOR` for new features/templates, `MAJOR` for breaking contract/backend cutovers) and sync `package-lock.json` (`npm install --package-lock-only`).
- [ ] **Dependency & Lockfile Audit:**
  - Ensure `npm ci` succeeds cleanly from a fresh checkout with zero lockfile drift.

---

## 3. Automated Quality Gates (Required Local & CI Verification)

Run the full verification suite locally against the release commit:

```bash
npm ci
npm run typecheck   # tsc --noEmit (must exit 0 with zero errors)
npm run lint        # eslint src --ext .ts,.tsx (must exit 0)
npm test            # vitest run (unit, component, CID, and axe accessibility tests)
```

### Opt-in Stellar Testnet Smoke Verification

When releasing changes that touch `src/services/stellar/` or `src/services/ipfs/`:

```bash
FOLDER_TESTNET_SMOKE=1 npx vitest run src/services/stellar/testnet
```

- [ ] Confirms `claim_folder` → `mint_portfolio` → `update_portfolio` → `verify_portfolio` / `get_portfolio` against the live Testnet contract (`CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV`).

---

## 4. Environment Variable & Security Audit (Browser Bundle Safety)

Vite embeds every `VITE_*` variable statically into the public client bundle at build time. Before running `npm run build` for deployment:

- [ ] **Zero secrets in `VITE_*`:** Confirm that no private keys, Stellar secret seeds (`S...`), IPFS pinning API keys, or backend admin tokens appear in `.env`, deployment environment variables, or `dist/assets/*.js`.
- [ ] **Production environment variables configured:**

| Variable | Production / Staging Requirement | Validation Rule (`src/config/env.ts`) |
|---|---|---|
| `VITE_API_URL` | Required (HTTPS URL of `Indexer-Backend` in staging/prod) | Valid `http:` or `https:` URL |
| `VITE_FOLDER_CONTRACT_ID` | Required (`CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV`) | Starts with `C`, 56-character Stellar contract strkey |
| `VITE_STELLAR_NETWORK` | `testnet` | Must equal `testnet` |
| `VITE_SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` (or dedicated RPC) | Valid `http:` or `https:` URL |
| `VITE_IPFS_GATEWAY_URL` | `https://ipfs.io/ipfs` (or dedicated gateway) | Valid `http:` or `https:` URL |
| `VITE_DEMO_MODE` | **`false`** (must NOT be `true` in live deployments unless deploying a dedicated demo preview) | `"true"` or `"false"` |

---

## 5. Production Build & Artifact Verification

```bash
npm run build
npm run preview -- --port 4173
```

- [ ] **`dist/` artifact check:**
  - Confirm `dist/index.html` and hashed `dist/assets/*` bundles are emitted cleanly.
  - Scan compiled JS assets to verify no localhost fallback URLs or secret tokens leaked into the production build when built with target env vars:
    ```bash
    grep -rn "SECRET" dist/ || true
    ```
- [ ] **SPA routing configuration:**
  - Verify that the hosting platform (Vercel, Cloudflare Pages, Nginx, or static CDN) rewrites deep links such as `/dashboard`, `/templates`, and `/p/jane.folder` to `/index.html` with HTTP `200` so refreshing a public portfolio route does not return a platform `404`.

---

## 6. Post-Deployment Smoke & UI State Verification

After deploying the build to the target environment, verify each critical user flow and UI state:

### 6.1 Configuration & Startup Gate
- [ ] App loads `/` without rendering `ConfigErrorScreen` (`src/main.tsx`).
- [ ] If deployed in live mode (`VITE_DEMO_MODE=false`), confirm the "Demo data" banner is **not** shown and fixture data from `src/data/fixtures/` is never served silently.

### 6.2 Wallet & Network Guardrails (`Freighter`)
- [ ] **Disconnected state:** Header displays "Connect Wallet"; protected actions on `/dashboard` prompt the user to connect.
- [ ] **Wrong-network guard:** Switching Freighter to `PUBLIC` / Mainnet displays the Testnet-enforcement warning banner and blocks `claim_folder`, `mint_portfolio`, and `update_portfolio`.
- [ ] **Session restore:** Reloading the page with Freighter connected restores the wallet address cleanly.

### 6.3 Core Folder & Portfolio Flows (Loading, Empty, Error & Success States)
- [ ] **Templates (`/templates`):** Renders template cards (Developer, Designer, Operations) with proper loading state and retry button if the backend is unreachable.
- [ ] **Claim & Mint (`/dashboard`):**
  - Folder name validation enforces `[a-z0-9-]{3,}` + `.folder` (`<= 64` chars total) with inline error messages before opening Freighter.
  - Transaction submission displays step-by-step status (`Simulating` → `Awaiting signature` → `Submitting` → `Confirmed`) with a working `stellar.expert/explorer/testnet/tx/<hash>` link.
- [ ] **Public Verification Page (`/p/:folderName`):**
  - Valid minted folder resolves on-chain `get_portfolio` and `verify_portfolio`, verifies the raw CIDv1 SHA-256 hash of the IPFS JSON payload, and displays the **"Verified on Stellar"** badge only when `verify_portfolio` returns `true`.
  - Non-existent folder (e.g. `/p/nonexistent-99999.folder`) renders a clear empty/not-found state without unhandled console exceptions.

### 6.4 Accessibility & Keyboard Sanity Check
- [ ] Interactive controls (wallet connect, navigation links, form inputs, retry buttons) are reachable via `Tab` / `Shift+Tab` with visible focus indicators.
- [ ] Status updates and form validation errors are announced via appropriate ARIA live regions / `aria-describedby`.

---

## 7. Rollback Procedure

If a regression is detected after deployment:

1. **Immediate frontend rollback:** Revert the hosting deployment to the previous immutable build artifact or tag (`git revert` / platform instant rollback). Because Folder Frontend is stateless and non-custodial, rolling back the static web bundle requires no database migration.
2. **Environment mismatch fix:** If `ConfigErrorScreen` appears due to a missing `VITE_*` variable in the hosting dashboard, restore the variable from `.env.example` / `docs/configuration.md` and trigger a fresh build.
