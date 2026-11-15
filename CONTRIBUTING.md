# Contributing to Folder Frontend

Thanks for helping build **Folder Frontend** (`D-Indexer/Indexer-Frontend`)! This guide defines our repository layout, branching and commit conventions, architectural boundaries, and review/quality expectations. For initial local setup, see the [README](README.md).

---

## 1. Issue Selection & Branching Workflow

1. **Pick an issue:** Start with issues labelled [`good first issue`](https://github.com/D-Indexer/Indexer-Frontend/labels/good%20first%20issue) or [`help wanted`](https://github.com/D-Indexer/Indexer-Frontend/labels/help%20wanted) and comment on the issue before starting work.
2. **Coordinate cross-repo changes early:**
   - Smart contract logic, `ContractError` definitions, and on-chain template registrations live in [`D-Indexer/Indexer-Contract`](https://github.com/D-Indexer/Indexer-Contract).
   - Indexing endpoints (`/folders`, `/portfolios`, `/templates`, `/health`) and IPFS pinning (`POST /upload`) live in [`D-Indexer/Indexer-Backend`](https://github.com/D-Indexer/Indexer-Backend).
3. **Create a focused branch from `main`:**
   - `feat/<short-slug>` — new user-facing capabilities or components
   - `fix/<short-slug>` — bug fixes, validation fixes, or error-handling improvements
   - `docs/<short-slug>` — documentation, ADRs (`docs/adr/`), or contributor guides
   - `test/<short-slug>` / `ci/<short-slug>` — test suites or GitHub Actions workflows
   - `refactor/<short-slug>` / `perf/<short-slug>` — internal restructuring or bundle optimizations

---

## 2. Commit Message & Pull Request Standards

### Commit Messages
- Follow clear, imperative commit subjects (Conventional Commits style preferred: `feat(folder): ...`, `fix(stellar): ...`, `docs: ...`).
- Explain **why** a change is made, not just what lines changed.
- Keep commits atomic; do not bundle unrelated formatting or dependency churn into a feature PR.

### Pull Requests
- Link the issue resolved in the PR body (`Closes #123`).
- Keep each PR scoped to a single coherent slice.
- For any UI or CSS change (`src/pages/`, `src/features/`, `src/components/`, `src/styles/`):
  - Include **before/after screenshots** (both desktop and `360px` mobile width where relevant).
  - Verify **loading**, **empty**, **error**, and **demo-mode (`VITE_DEMO_MODE=true`)** states.
  - Verify keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Escape`) and visible focus rings.

---

## 3. Architectural Boundaries (Where Code Goes)

Follow the module boundary rules established in [`docs/architecture.md`](docs/architecture.md) and [`docs/adr/0001-frontend-module-boundaries.md`](docs/adr/0001-frontend-module-boundaries.md):

| Path | Responsibility | Boundary Rules |
| --- | --- | --- |
| `src/pages/` | Route-level screens that compose features (`/`, `/dashboard`, `/templates`, `/p/:folderName`) | Keep thin; delegate business logic and state to `src/features/` and `src/services/`. |
| `src/features/<feature>/` | Product workflows (`wallet`, `folder`, `portfolio`, `public-portfolio`, `templates`, `transactions`) | May import from `src/components/`, `src/services/`, `src/store/`, and `src/config/`. |
| `src/components/ui/`, `src/components/forms/` | Reusable, product-agnostic UI primitives (`AsyncContent`, form controls, buttons) | Must not import domain services (`src/services/stellar/` or `src/services/data/`). |
| `src/services/` | Backend (`portfolio`, `folder`), IPFS (`ipfsService`, CID verification), and Stellar (`stellarService`, `freighterWallet`, `contractErrors`) adapters | **Pure TypeScript — no React components or hooks here.** All external I/O is isolated in this layer. |
| `src/store/` | Zustand state stores (`walletStore.ts`) | Holds shared client session state; keep derived state minimal. |
| `src/config/` | Environment parsing/validation (`env.ts`) and route definitions (`routes.ts`) | `parseEnv` must remain a pure, unit-tested function. |
| `src/data/fixtures/` | Demo-mode fixtures **only** | **Never** import fixtures outside `src/services/data/folderData.ts`. |
| `src/testing/` | Shared test helpers, builders, and mocks | Used only by `*.test.ts` / `*.test.tsx` files. |

---

## 4. Coding, Security & Accessibility Expectations

1. **No silent mock fallback:**
   - When `VITE_DEMO_MODE` is not `true`, API, RPC, or IPFS failures must propagate and render an explicit error state with a retry action — never silently serve fixture data.
2. **Contract-aligned validation:**
   - Client-side validation (folder names `[a-z0-9-]{3,}.folder` `<= 64` chars, raw CIDv1 format, `ContractError` mappings `1`–`19`) must mirror `Indexer-Contract` rules rather than inventing divergent client rules.
3. **Browser bundle security & privacy:**
   - Every `VITE_*` variable is compiled into the public client bundle. **Never** place secrets, private keys, or IPFS pinning tokens in `VITE_*` variables or source files.
   - Any new `VITE_*` variable must be added to `src/config/env.ts` (with validation + unit tests), `.env.example`, and `docs/configuration.md`.
   - Always verify IPFS content against its on-chain CID (`sha2-256` raw CIDv1 check) and sanitize/validate external links (`https:` / `mailto:`) before rendering user-supplied portfolio fields.
4. **Testing & Accessibility:**
   - Write unit and component tests using **Vitest** and **React Testing Library**.
   - Query elements the way a user or assistive technology does (`getByRole`, `getByLabelText`, `findByRole`) rather than brittle CSS selectors.
   - Include `axe-core` accessibility assertions on rendered views and ensure dynamic states (transaction progress, errors) use semantic live regions.

---

## 5. Required Pre-Push Verification

Before opening or updating a PR, run the exact commands enforced by `.github/workflows/ci.yml`:

```bash
npm ci
npm run typecheck   # tsc --noEmit
npm run lint        # eslint src --ext .ts,.tsx
npm test            # vitest run
npm run build       # vite build (with VITE_API_URL & VITE_FOLDER_CONTRACT_ID)
```

If your change touches `src/services/stellar/`, you can also run the opt-in live Testnet smoke test (requires network access to `https://soroban-testnet.stellar.org`):

```bash
FOLDER_TESTNET_SMOKE=1 npx vitest run src/services/stellar/testnet
```
