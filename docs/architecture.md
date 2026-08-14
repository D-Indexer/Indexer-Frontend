# Architecture

Folder Frontend is organized around application shell code, feature modules, service adapters, shared UI primitives, and typed domain models.

## Runtime layers

1. `src/App.tsx` defines the route tree.
2. `src/layouts/` owns the persistent app frame.
3. `src/pages/` composes feature modules into route-level screens.
4. `src/features/` contains product-specific UI for home, dashboard, templates, auth, portfolios, and verification.
5. `src/domain/` contains pure domain helpers that can be tested without React.
6. `src/services/` isolates API, IPFS, and Stellar integration details.
7. `src/store/` owns client-side Zustand state.
8. `src/types/` defines shared domain contracts.

## Folder conventions

- `src/components/ui/` contains framework-neutral UI primitives.
- `src/components/forms/` contains reusable form controls and accessibility wiring.
- `src/data/fixtures/` contains local fallback data for development and demo states.
- `src/domain/portfolio/` contains portfolio sorting, status aggregation, and analytics helpers.

## Boundaries

The frontend does not enforce portfolio ownership or credential verification authority. Those checks belong in the Folder backend and Soroban contract. Browser configuration must be treated as public.
