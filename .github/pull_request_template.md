## Summary

<!-- Explain WHAT changed and WHY. Link the issue this PR resolves. -->

Closes #

## Type of Change

- [ ] `feat`: New user-facing feature or workflow
- [ ] `fix`: Bug fix or error-handling improvement
- [ ] `docs`: Documentation, ADR, or contributor guide update
- [ ] `refactor` / `perf`: Internal architecture or bundle/performance improvement
- [ ] `test` / `ci`: Test coverage or CI workflow update

## Cross-Repository Coordination

- [ ] Self-contained in `Indexer-Frontend`
- [ ] Coordinates with [`Indexer-Contract`](https://github.com/D-Indexer/Indexer-Contract) (specify contract method / error code / template ID: `___`)
- [ ] Coordinates with [`Indexer-Backend`](https://github.com/D-Indexer/Indexer-Backend) (specify endpoint / payload schema: `___`)

## Verification & Quality Gates

- [ ] `npm run typecheck` (`tsc --noEmit`) passes with zero errors
- [ ] `npm run lint` (`eslint src --ext .ts,.tsx`) passes with zero warnings/errors
- [ ] `npm test` (`vitest run`) passes, including unit, component, and `axe-core` checks
- [ ] `npm run build` (`vite build`) succeeds cleanly

## UI States & Edge Cases Checklist

*(Check all that apply, or mark N/A for non-UI / documentation changes)*

- [ ] **Loading state:** Uses `AsyncContent` / accessible loading indicator while awaiting RPC, backend, or IPFS responses
- [ ] **Empty state:** Handles missing folders/portfolios/templates cleanly without crashing
- [ ] **Error state:** Surfaces actionable error messages (including mapped `ContractError` codes `1`–`19`) with a working retry path; **never** falls back silently to demo fixtures unless `VITE_DEMO_MODE=true`
- [ ] **Demo mode (`VITE_DEMO_MODE=true`):** Tested with demo mode enabled; "Demo data" banner remains visible and on-chain writes remain disabled

## Accessibility (a11y) Checklist

- [ ] Semantic HTML heading hierarchy (`h1` → `h2` → `h3`) and form `<label>` associations preserved
- [ ] All interactive controls work via keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`) with visible focus states
- [ ] Dynamic status updates (transaction progress, validation errors, copy confirmation) use appropriate `aria-live` / `role="status"` / `role="alert"` attributes
- [ ] Automated `axe-core` assertions pass in component tests

## Security & Privacy Checklist

- [ ] **No secrets in browser bundle:** No private keys, Stellar secret seeds (`S...`), or pinning credentials added to `VITE_*` variables or source files
- [ ] **New `VITE_*` variables** (if any) are validated in `src/config/env.ts`, added to `.env.example`, and documented in `docs/configuration.md`
- [ ] **Untrusted content & CID verification:** IPFS JSON content is validated against its on-chain CID (`raw` CIDv1 SHA-256 check) and rendered safely without `dangerouslySetInnerHTML` or unvalidated `javascript:`/`data:` URLs
- [ ] **Testnet guard:** Wallet transactions remain blocked when Freighter is not on Stellar Testnet

## Screenshots / Screen Recordings (Before & After)

<!-- Required for any visual or layout change. Include desktop and mobile (360px) views where applicable. -->

| Before | After |
| --- | --- |
| _N/A or paste image_ | _N/A or paste image_ |
