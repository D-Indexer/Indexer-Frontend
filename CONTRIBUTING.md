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

## Git hooks

`npm ci` installs [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) via the
`prepare` script. The hooks are:

| Hook | Runs |
| --- | --- |
| `pre-commit` | `lint-staged`: ESLint `--fix` + Prettier on staged files |
| `pre-push` | `tsc --noEmit` and `vitest related --run` (tests touching the changed files) |

Skip them when you need to (e.g. a WIP commit or a docs-only push):

```bash
SKIP_SIMPLE_GIT_HOOKS=1 git commit -m "wip"
SKIP_SIMPLE_GIT_HOOKS=1 git push
```

Reinstall after changing the hook config with `npx simple-git-hooks`. Formatting is Prettier with
`.prettierrc.json` (no semicolons, single quotes, 100 columns); run `npm run format` to apply it.

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
- Tests: Vitest + Testing Library. Query by role/label, as a user would. Network calls are mocked,
  except the opt-in testnet smoke test.
