# Configuration

Copy `.env.example` to `.env`. Vite reads `VITE_*` variables at build time and compiles them into
the browser bundle, so **never put secrets in them**. Uploads go through Indexer-Backend; the
frontend holds no IPFS or pinning credentials.

The variables are parsed and validated in [`src/config/env.ts`](../src/config/env.ts) at startup.
If a required variable is missing or malformed, the app renders a configuration error screen
listing each problem instead of starting.

| Variable | Required | Default | Validation | Purpose |
| --- | --- | --- | --- | --- |
| `VITE_API_URL` | Yes, unless demo mode | none | http(s) URL | Indexer-Backend base URL (`/folders`, `/portfolios`, `/templates`, `/upload`). |
| `VITE_FOLDER_CONTRACT_ID` | Yes, unless demo mode | none | `C` + 55 base32 chars | Folder contract that transactions are built against. Testnet: `CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV`. |
| `VITE_STELLAR_NETWORK` | No | `testnet` | must be `testnet` | Network the app expects the wallet to be on. The contract is not deployed on mainnet. |
| `VITE_SOROBAN_RPC_URL` | No | `https://soroban-testnet.stellar.org` | http(s) URL | Soroban RPC used to simulate, submit and poll transactions and to call `verify_portfolio`. |
| `VITE_IPFS_GATEWAY_URL` | No | `https://ipfs.io/ipfs` | http(s) URL | Gateway used to read portfolio and template JSON (`<gateway>/<cid>`). Use `http://localhost:8080/ipfs` with the backend's local Kubo node. |
| `VITE_DEMO_MODE` | No | `false` | `true` enables it | Serves bundled fixtures, shows a persistent "Demo data" banner and disables wallet transactions. |

## Demo mode

With `VITE_DEMO_MODE=true` the app does not call the backend. Templates, a sample folder
(`demo.folder`) and its portfolio come from `src/data/fixtures`. Every page shows a "Demo data"
banner, and claim/mint/update buttons are disabled. Without demo mode, fixtures are never used:
API failures show an error state with a retry button.
