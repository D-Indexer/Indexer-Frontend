# Contributing to Folder Frontend

Thanks for helping! This guide is short on purpose; the [README](README.md) covers setup.

## Workflow

1. Pick an issue (start with `good first issue`) and comment that you're taking it.
2. Branch from `main`: `feat/<short-name>` or `fix/<short-name>`.
3. Keep PRs small and focused. Explain *why* in the description and link the issue.
4. Before pushing, run what CI runs:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

5. UI changes: include a screenshot, and check keyboard use plus the loading, empty and error states.

## Where code goes

| Path | For |
| --- | --- |
| `src/pages/` | Route-level screens that compose features |
| `src/features/<feature>/` | Product workflows (wallet, folder, portfolio, public-portfolio, templates, transactions) |
| `src/components/ui/`, `src/components/forms/` | Reusable, product-agnostic UI primitives |
| `src/services/` | Backend, IPFS and Stellar adapters. No React here |
| `src/config/` | Env parsing/validation and routes |
| `src/data/fixtures/` | Demo-mode fixtures **only**; never import them outside `services/data` |
| `src/testing/` | Test helpers and shared fixtures |

## Rules of thumb

- Never fall back to fake data silently. Show an error with a retry, or use demo mode.
- Client-side validation should mirror the contract (`Indexer-Contract/docs/VALIDATION.md`), not invent new rules.
- Every `VITE_*` variable is public. Secrets belong in the backend.
- New `VITE_*` variables must be added to `src/config/env.ts`, `.env.example` and `docs/configuration.md`.
- Tests: Vitest + Testing Library. Query by role/label, as a user would. Network calls are mocked
  at the HTTP level with MSW (`src/testing/msw/`); seed `mockDb` per test and use `server.use(...)`
  for error cases. Unhandled requests fail the test. The opt-in testnet smoke test is the only
  exception.
- Wallet state: read it through the selector hooks in `src/store` (`useWalletAddress`,
  `useWalletStatus`, ...). Never subscribe to the whole `useWalletStore`.

## Mock mode

`npm run dev:mock` starts the app with the MSW service worker in the browser, serving the same
handlers the tests use (seeded with the demo fixtures). No backend, IPFS node or wallet funds needed.

## Nightly testnet smoke test

`.github/workflows/testnet-smoke.yml` runs `FOLDER_TESTNET_SMOKE=1 npm test -- testnet` every night
(and on demand via *Run workflow*). On failure it opens, or comments on, a single
**Testnet smoke failing** issue, and closes it when a later run passes.

Setup (maintainers):

1. Generate a testnet keypair, e.g. at https://laboratory.stellar.org, and fund it with Friendbot.
2. Add its secret key as the repository secret `FOLDER_TESTNET_FUNDER_SECRET`
   (*Settings → Secrets and variables → Actions*). It only funds a fresh account per run, so it
   holds testnet lumens only. Never use a mainnet key.
3. After a testnet reset the test re-funds the funder via Friendbot automatically. If the secret is
   missing, the test falls back to funding the fresh account directly with Friendbot.
