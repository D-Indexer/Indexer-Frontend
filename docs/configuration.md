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
| `VITE_IPFS_BUILD` | No | `false` | `true` enables it | Switches to hash routing for the IPFS release build (see [IPFS releases](#ipfs-releases)). |

## PR preview deployments

Every pull request is built with `VITE_DEMO_MODE=true` by
[`.github/workflows/preview.yml`](../.github/workflows/preview.yml) and published to Cloudflare
Pages (SPA fallback via `dist/404.html`). The workflow comments the preview URL on the PR and
deletes the preview deployment when the PR closes.

Repository setup (maintainers):

| Kind | Name | Purpose |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | Pages:Edit token for the preview project. |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account owning the project. |
| Variable | `CLOUDFLARE_PAGES_PROJECT` | Pages project name (Direct Upload). |

Fork PRs only run the build job: the deploy and cleanup jobs are gated on
`pull_request.head.repo.full_name == github.repository`, so fork code never runs with deployment
secrets.

## Releases

Versions follow [SemVer](https://semver.org/) and are managed by
[release-please](https://github.com/googleapis/release-please) from Conventional Commits on `main`
(`release-please-config.json`, `.release-please-manifest.json`). PR titles are validated by
[`.github/workflows/pr-title.yml`](../.github/workflows/pr-title.yml) and `commitlint.config.cjs`.
Merging the release PR bumps `package.json`, updates `CHANGELOG.md`, creates the `vX.Y.Z` tag and
publishes the GitHub release. The footer shows the version from `package.json`, injected at build
time as `__APP_VERSION__` by `vite.config.ts` (not a `VITE_*` variable).

## IPFS releases

Every published GitHub release is also uploaded to IPFS by
[`.github/workflows/ipfs-release.yml`](../.github/workflows/ipfs-release.yml). The build uses
relative asset paths (`base: './'` in `vite.config.ts`) and hash routing (`VITE_IPFS_BUILD=true`),
so the same CID renders every route, including deep links such as `#/p/<folderName>`, from any
gateway path (`https://<gateway>/ipfs/<cid>/#/dashboard`).

The workflow:

1. Builds `dist/` with `VITE_IPFS_BUILD=true` and the public `VITE_*` values from repository
   variables (never secrets).
2. Uploads `dist/` to IPFS with `ipfs add --cid-version 1 --recursive` and pins it.
3. Verifies the CID through two public gateways (`ipfs.io` and `dweb.link`): `index.html` must
   return 200 and contain the app root, and the hashed JS asset must return 200.
4. Appends the CID and gateway links to the GitHub release notes.
5. Optionally updates the DNSLink TXT record `_dnslink.<domain>` when `IPFS_DNSLINK_DOMAIN` is set.

Repository setup (maintainers):

| Kind | Name | Purpose |
| --- | --- | --- |
| Variable | `IPFS_API_URL` | Kubo RPC endpoint of the pinning node, e.g. `https://ipfs.example.com:5001`. |
| Secret | `IPFS_API_TOKEN` | Bearer token for that endpoint (omit if the node is unauthenticated). |
| Variable | `IPFS_DNSLINK_DOMAIN` | Optional. Domain whose `_dnslink` TXT record points at the release CID. |
| Secret | `CLOUDFLARE_API_TOKEN` | Only for DNSLink: token with `Zone.DNS:Edit` on the domain's zone. |
| Variable | `CLOUDFLARE_ZONE_ID` | Only for DNSLink: zone ID of `IPFS_DNSLINK_DOMAIN`. |

Manual run: `workflow_dispatch` with a tag input re-publishes an existing release. To publish
locally, run `VITE_IPFS_BUILD=true npm run build` and `ipfs add -r --cid-version 1 dist`.

## Demo mode

With `VITE_DEMO_MODE=true` the app does not call the backend. Templates, a sample folder
(`demo.folder`) and its portfolio come from `src/data/fixtures`. Every page shows a "Demo data"
banner, and claim/mint/update buttons are disabled. Without demo mode, fixtures are never used:
API failures show an error state with a retry button.
