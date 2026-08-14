# ADR 0001: Frontend Module Boundaries

## Status

Accepted

## Context

Folder Frontend is growing from a lean Vite application into a production client that needs clear ownership boundaries. The repo already separates pages, features, services, stores, styles, and shared UI.

## Decision

Use these top-level source boundaries:

- `src/app/` for application assembly concerns such as routing.
- `src/components/` for shared UI and form primitives that are not product-feature specific.
- `src/domain/` for pure business rules and derived calculations.
- `src/features/` for product workflows and route-composed UI.
- `src/services/` for external API, IPFS, Stellar, and integration adapters.
- `src/testing/` for reusable typed test data builders and future test utilities.

## Consequences

Feature components should not duplicate domain calculations. Services should not import React components. Shared components should remain product-agnostic.
