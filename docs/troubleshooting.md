# Troubleshooting Guide

This guide covers common setup, configuration, API (`Indexer-Backend`), IPFS gateway, Stellar Testnet / Freighter wallet, and Vite dev-server issues encountered when developing or running **Folder Frontend** (`D-Indexer/Indexer-Frontend`).

---

## 1. Startup & Environment Configuration (`ConfigErrorScreen`)

### Symptom: App boots into the "Configuration error" screen instead of the home page

**Cause:**
`src/main.tsx` runs `parseEnv(import.meta.env)` from [`src/config/env.ts`](../src/config/env.ts) before mounting the router. Unless `VITE_DEMO_MODE=true`, both `VITE_API_URL` and `VITE_FOLDER_CONTRACT_ID` are strictly required and validated.

**Fixes:**
1. Copy `.env.example` to `.env` in the repository root:
   ```bash
   cp .env.example .env
   ```
2. Verify each variable satisfies the validation rules in `src/config/env.ts`:
   - `VITE_API_URL`: Must be a valid `http://` or `https://` URL (default: `http://localhost:3000`).
   - `VITE_FOLDER_CONTRACT_ID`: Must be a 56-character Stellar contract strkey starting with `C` in base32 (`A–Z`, `2–7`) (default Testnet contract: `CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV`).
   - `VITE_STELLAR_NETWORK`: Must be `testnet` (Mainnet is intentionally rejected until mainnet contract deployment).
   - `VITE_SOROBAN_RPC_URL` & `VITE_IPFS_GATEWAY_URL`: Must be valid `http://` or `https://` URLs if set.
3. Restart `npm run dev` after editing `.env` (Vite only reloads `.env` changes on server restart).
4. **Want to run without the backend or wallet?** Start in Demo Mode:
   ```bash
   VITE_DEMO_MODE=true npm run dev
   ```

---

## 2. `Indexer-Backend` API & Upload Failures

### 2.1 Symptom: `Network Error` or `ERR_CONNECTION_REFUSED` against `http://localhost:3000`

**Cause:**
The frontend cannot reach `Indexer-Backend` (`/folders`, `/portfolios`, `/templates`, `/upload`). By design (ADR-0001 & `src/services/data/folderData.ts`), the app **never** silently falls back to mock data when `VITE_DEMO_MODE=false`.

**Fixes:**
1. Ensure the `Indexer-Backend` Docker Compose stack (Postgres + Kubo IPFS + API + Indexer) is running:
   ```bash
   cd ../Indexer-Backend
   docker compose up --build
   ```
2. Check that the backend health endpoint responds:
   ```bash
   curl -i http://localhost:3000/health
   ```
3. Confirm `VITE_API_URL` in `.env` matches the port where `Indexer-Backend` is listening.

### 2.2 Symptom: `POST /upload` returns `400 Bad Request` / unsupported file type when minting or updating a portfolio

**Cause:**
As noted in [README.md](../README.md#status), the frontend serializes the portfolio metadata as JSON and uploads it to `POST /upload`. If the running version of `Indexer-Backend` only allows image/PDF MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), it rejects `application/json` uploads.

**Fixes:**
- Pull the latest `Indexer-Backend` branch that enables JSON/raw block pinning on `POST /upload`, **or**
- To verify the on-chain contract pipeline (`claim_folder` → `mint_portfolio` → `update_portfolio` → `verify_portfolio`) independently of `POST /upload`, run the opt-in Testnet smoke suite:
  ```bash
  FOLDER_TESTNET_SMOKE=1 npx vitest run src/services/stellar/testnet
  ```

### 2.3 Symptom: Newly claimed folder or minted portfolio does not appear immediately on `/dashboard`

**Cause:**
After a transaction is confirmed on Stellar Testnet, `Indexer-Backend` must ingest the latest ledger events before `GET /folders` or `GET /portfolios` reflects the new state.

**Fixes:**
- Wait a few seconds for the indexer polling loop to catch up to the transaction's ledger sequence, or click **Retry / Refresh**.
- Note: Public verification on `/p/<name>.folder` reads `get_portfolio` and `verify_portfolio` directly from Soroban RPC (`src/services/stellar/stellarService.ts`), so the on-chain CID is always authoritative even if the indexer cache lags.

---

## 3. IPFS Gateway & CID Verification Errors

### 3.1 Symptom: Public page `/p/:folderName` or template loader fails with a gateway timeout (`504` / `429`)

**Cause:**
Public IPFS gateways (such as `https://ipfs.io/ipfs`) rate-limit requests or take time to discover newly pinned blocks over the DHT when running a local Kubo node.

**Fixes:**
- When running `Indexer-Backend` locally via `docker compose`, point `VITE_IPFS_GATEWAY_URL` directly at the local Kubo HTTP gateway in `.env`:
  ```ini
  VITE_IPFS_GATEWAY_URL=http://localhost:8080/ipfs
  ```
- Restart `npm run dev` so reads resolve instantaneously from your local IPFS node.

### 3.2 Symptom: `CID mismatch` or integrity verification error when loading portfolio/template JSON

**Cause:**
`src/services/ipfs/` computes the raw CIDv1 (`sha2-256`) of the downloaded bytes and compares it against the CID stored on-chain in the Folder Soroban contract. This error fires if:
1. The gateway returned an HTML error page or truncated payload instead of the raw JSON bytes, or
2. The file was pinned using a non-raw DAG layout that differs from the expected raw single-block CIDv1, or
3. The gateway content was tampered with.

**Fixes:**
- Inspect the Network tab for `<VITE_IPFS_GATEWAY_URL>/<cid>` to confirm it returns HTTP `200` with `application/json` (or raw JSON bytes).
- Run `npx vitest run src/services/ipfs` to verify local CID computation and validation rules (`cid.test.ts`).

---

## 4. Stellar Testnet, Soroban RPC & Freighter Wallet Issues

### 4.1 Symptom: "Freighter not detected" or connect button fails

**Cause:**
The [Freighter browser extension](https://www.freighter.app/) is not installed, is disabled for the current browser profile, or has not granted site access.

**Fixes:**
1. Install Freighter in Chromium/Chrome/Brave/Firefox and unlock your wallet.
2. Ensure Freighter is allowed to run on `http://localhost:5173`.
3. Refresh the page and click **Connect Wallet**.

### 4.2 Symptom: On-chain actions are disabled with a "Switch Freighter to Testnet" warning

**Cause:**
Folder Frontend enforces Stellar Testnet (`Test SDF Network ; September 2015`). If Freighter is set to `PUBLIC` (Mainnet) or `FUTURENET`, `src/features/wallet/` blocks all contract writes (`claim_folder`, `mint_portfolio`, `update_portfolio`) to prevent signing against the wrong network.

**Fixes:**
1. Open the Freighter extension → click the network selector at the top → select **Testnet**.
2. Fund your Testnet account with XLM via Friendbot (`https://friendbot.stellar.org/?addr=<YOUR_PUBLIC_KEY>` or Stellar Laboratory).

### 4.3 Symptom: Contract call fails with `ContractError` (codes `1`–`19`) or simulation failure

**Cause:**
Soroban simulation (`simulateTransaction` in `src/services/stellar/stellarService.ts`) rejected the call before signing, or the contract returned a typed `Error(Contract, #N)` result mapped in [`src/services/stellar/contractErrors.ts`](../src/services/stellar/contractErrors.ts).

Common contract error codes:
- **Folder name already claimed / invalid format:** Ensure the name has at least 3 lowercase `[a-z0-9-]` characters before `.folder` and is at most 64 characters total.
- **Unfunded account (`Account not found`):** The connected Freighter Testnet account has never been funded on the current Testnet ledger (note: Stellar Testnet resets periodically; re-fund via Friendbot after a reset).
- **Soroban RPC unreachable (`VITE_SOROBAN_RPC_URL`):** Test connectivity with:
  ```bash
  curl -s -X POST https://soroban-testnet.stellar.org \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
  ```

---

## 5. Vite Dev Server, Proxy / CORS & Build Issues

### 5.1 Symptom: CORS error in browser console when calling `VITE_API_URL` or `VITE_IPFS_GATEWAY_URL`

**Cause:**
The browser blocks cross-origin requests from `http://localhost:5173` if `Indexer-Backend` (`:3000`) or the local Kubo IPFS gateway (`:8080`) does not include `Access-Control-Allow-Origin: http://localhost:5173` (or `*`).

**Fixes:**
1. Verify `CORS_ORIGIN` in `Indexer-Backend` includes `http://localhost:5173`.
2. For local Kubo (`:8080`), ensure Kubo's `Gateway.HTTPHeaders` allows `Access-Control-Allow-Origin: ["*"]` (configured in `Indexer-Backend`'s `docker-compose.yml`), **or** configure a local Vite dev proxy during development so `/api` and `/ipfs` share the `:5173` origin.

### 5.2 Symptom: `npm run typecheck` or `npm run build` fails after pulling new changes

**Fixes:**
1. Reinstall exact dependencies from `package-lock.json`:
   ```bash
   npm ci
   ```
2. Verify your Node.js version is **20+** (`node -v`, per `package.json#engines`).
3. Run the four CI checks in order to isolate the failure:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
