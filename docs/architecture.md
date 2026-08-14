# Architecture

Folder Frontend is organized around application shell code, feature modules, service adapters, shared UI primitives, and typed domain models.

## Runtime layers

1. `src/App.tsx` defines the route tree.
2. `src/layouts/` owns the persistent app frame.
3. `src/pages/` composes feature modules into route-level screens.
4. `src/features/` contains product-specific UI for home, templates, auth, and portfolios.
5. `src/services/` isolates API, IPFS, and Stellar integration details.
6. `src/store/` owns client-side Zustand state.
7. `src/types/` defines shared domain contracts.

## Boundaries

The frontend does not enforce portfolio ownership or credential verification authority. Those checks belong in the Folder backend and Soroban contract. Browser configuration must be treated as public.
