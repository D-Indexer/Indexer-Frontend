# ADR 0001: Frontend Module Boundaries

## Status

Accepted. Amended 2026-11-10: `src/domain/` was removed together with the list dashboard and
template pricing, which modelled API fields the backend does not provide. Pure helpers now live
in `src/utils/` or, for folder-name and CID rules, the shared `@folder/validation` package
(ADR 0002). Amended 2026-11-23: the boundaries below are enforced by `eslint-plugin-boundaries`
(`.eslintrc.cjs`) and import cycles by `npm run lint:cycles` (madge), both in CI.

## Context

Folder Frontend is growing from a lean Vite application into a production client that needs clear ownership boundaries. The repo already separates pages, features, services, stores, styles, and shared UI.

## Decision

Use these top-level source boundaries. "May import" is enforced by `boundaries/element-types`;
anything not listed fails lint. `config`, `constants`, `types`, `utils` and `@folder/validation`
are shared leaves that every layer may import.

| Layer | Purpose | May import |
| --- | --- | --- |
| `src/main.tsx`, `src/App.tsx` | Bootstrap | app, layouts, pages, components, shared |
| `src/app/` | Application assembly (routing, config screen) | pages, layouts, features, components, hooks, store, shared |
| `src/pages/` | Route components | layouts, features, components, hooks, services, store, data, shared |
| `src/layouts/` | Page chrome | features, components, hooks, services, store, shared |
| `src/features/*` | Product workflows; other features only via their `index.ts` | features, components, hooks, services, store, data, shared |
| `src/hooks/` | Data-loading hooks | services, store, data, shared |
| `src/components/` | Product-agnostic UI and form primitives | shared only |
| `src/store/` | zustand stores | services, shared |
| `src/services/` | API, IPFS, Stellar adapters | data, shared (never store, never React) |
| `src/data/` | Static data and demo fixtures | shared |
| `src/testing/` | Test builders and setup | store, services, data, shared |
| `packages/validation` | Contract-mirrored rules (ADR 0002) | nothing |

`boundaries/external` forbids `react`, `react-dom` and `react-router-dom` in services, data, config,
constants, types, utils and `@folder/validation`. Test files (`*.test.ts(x)`) are exempt from both
rules so they can build fixtures and mocks across layers.

## Consequences

Services cannot import React components or stores, and shared components stay product-agnostic.
Import cycles in `src/` and `packages/` fail CI (`npm run lint:cycles`).
