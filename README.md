# Folder Frontend 🏗️

[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-blue?logo=stellar)](https://stellar.org)
[![React](https://img.shields.io/badge/Frontend-React-61dafb?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646cff?logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?logo=typescript)](https://www.typescriptlang.org)

React/Vite frontend for Folder — a Stellar-based portfolio identity app for creating, verifying, and monetizing professional portfolios backed by IPFS metadata and Soroban contract integrations.

## Overview

Folder Frontend is the browser client for the Folder platform. It provides the user interface for wallet/auth state, portfolio template discovery, portfolio creation, portfolio lookup, IPFS metadata upload, and API calls that coordinate with Folder backend services and the deployed Stellar/Soroban contract.

### The Problem

Professional portfolios are usually static, easy to duplicate, and disconnected from verifiable proof of work. Recruiters, clients, and collaborators often need to trust screenshots, links, or manually curated claims without a portable verification layer.

Folder addresses this by treating a portfolio as a portable on-chain identity surface:

- **Portfolio ownership is tied to a Stellar address** instead of a platform account alone
- **Portfolio metadata is content-addressed through IPFS** so updates can be referenced by immutable CIDs
- **Credential and proof-of-work flows are exposed through API endpoints** for GitHub, LinkedIn, and on-chain activity
- **Templates provide a marketplace-oriented creation flow** for portfolio layouts and schemas

### What Folder Frontend Does

At a high level, this repo does five things:

- **🏠 Presents the Folder landing experience** — unauthenticated users see the product hero and authenticated users see available templates
- **📊 Tracks portfolio operations** — the dashboard summarizes portfolio counts, verification rate, pending records, and recent metadata CIDs
- **🧩 Lists portfolio templates** — fetches templates from the configured API and displays name, description, and XLM price
- **📝 Creates portfolio metadata** — validates form input, uploads portfolio JSON to IPFS, and sends the resulting CID to the portfolio API
- **🔎 Displays portfolio status** — loads portfolio records by route parameter and shows creation, metadata, and verification state

> 🔒 **Security Model**: this repository is a frontend client. It should not store private keys, service secrets, API admin keys, or privileged contract credentials. Browser-exposed settings must use `VITE_` variables and should be treated as public.

## D-Indexer Repository Map

Folder is split across three public repositories in the `D-Indexer` GitHub organization:

| Repository | Role | Primary language |
| --- | --- | --- |
| [Indexer-Frontend](https://github.com/D-Indexer/Indexer-Frontend) | React/Vite browser client for portfolio creation, template discovery, dashboard monitoring, IPFS metadata submission, and portfolio status display. | TypeScript |
| [Indexer-Backend](https://github.com/D-Indexer/Indexer-Backend) | Core API and indexing engine for off-chain user data, IPFS uploads, metadata caching, and Stellar ledger integration hooks. | TypeScript |
| [Indexer-Contract](https://github.com/D-Indexer/Indexer-Contract) | Soroban smart contracts for the on-chain template registry, user identity mapping, and portfolio NFT minting on Stellar. | Rust |

### How The Repositories Work Together

1. `Indexer-Frontend` renders the Folder web experience and sends portfolio, template, credential, and proof requests to the backend.
2. `Indexer-Backend` validates requests, coordinates metadata storage, caches portfolio state, and bridges browser workflows to Stellar/Soroban operations.
3. `Indexer-Contract` persists the trust-critical on-chain registry and ownership state that makes portfolio records verifiable.

### Local Development Order

1. Start `Indexer-Contract` or configure this frontend with an already deployed Soroban contract ID.
2. Start `Indexer-Backend` with API, IPFS, Stellar, and contract configuration.
3. Start `Indexer-Frontend` and point `VITE_API_URL` at the backend service.

## Features

- **React 18 + Vite**: fast local development and production build pipeline
- **TypeScript**: typed portfolio, template, credential, proof-of-work, and user models
- **React Router**: routes for `/`, `/dashboard`, `/templates`, `/portfolios/new`, and `/portfolio/:id`
- **Zustand State**: lightweight auth and portfolio state stores
- **Axios API Client**: portfolio, template, credential, and proof-of-work endpoint wrappers
- **IPFS Client Helpers**: JSON/file upload and CID gateway URL construction
- **Stellar SDK Helpers**: testnet/mainnet passphrase selection, keypair creation, address validation, and transaction signing utilities
- **Environment-Based Configuration**: API, Stellar network, contract ID, IPFS, GitHub, and LinkedIn endpoints are configured through `.env`
- **Local Fallback Fixtures**: template and dashboard data stay usable when the backend is not running during local development
- **Reusable UI/Form Primitives**: shared buttons, link buttons, cards, states, stats, badges, and accessible form fields

## Architecture

```mermaid
graph TB
    subgraph Browser["Browser Client"]
        APP[App.tsx]
        ROUTER[React Router]
        HOME[Home Page]
        DASHBOARD[Dashboard Page]
        TEMPLATES_PAGE[Templates Page]
        CREATE[Create Portfolio Page]
        PORTFOLIO[Portfolio Page]
    end

    subgraph UI["UI Components"]
        LOGIN[LoginButton]
        TEMPLATES[TemplateGrid]
        DASH_METRICS[DashboardMetrics]
        TABLE[PortfolioTable]
        EDITOR[PortfolioEditor]
        CHECKLIST[VerificationChecklist]
    end

    subgraph State["Client State"]
        AUTH[authStore]
        PORT_STORE[portfolioStore]
    end

    subgraph Services["Frontend Services"]
        API[Axios API Client]
        IPFS[ipfsService]
        STELLAR[stellarService]
    end

    subgraph External["External Systems"]
        BACKEND[Folder API]
        IPFS_NODE[IPFS API / Gateway]
        CONTRACT[Soroban Contract]
        STELLAR_NET[Stellar Network]
        GITHUB[GitHub API]
        LINKEDIN[LinkedIn API]
    end

    APP --> ROUTER
    ROUTER --> HOME
    ROUTER --> DASHBOARD
    ROUTER --> TEMPLATES_PAGE
    ROUTER --> CREATE
    ROUTER --> PORTFOLIO
    HOME --> LOGIN
    HOME --> TEMPLATES
    DASHBOARD --> DASH_METRICS
    DASHBOARD --> TABLE
    DASHBOARD --> API
    TEMPLATES_PAGE --> TEMPLATES
    CREATE --> EDITOR
    EDITOR --> IPFS
    EDITOR --> API
    LOGIN --> AUTH
    TEMPLATES --> API
    PORTFOLIO --> API
    PORTFOLIO --> CHECKLIST
    API --> BACKEND
    IPFS --> IPFS_NODE
    STELLAR --> CONTRACT
    CONTRACT --> STELLAR_NET
    BACKEND --> CONTRACT
    BACKEND --> GITHUB
    BACKEND --> LINKEDIN
    EDITOR --> PORT_STORE
```

### Core Components

- **src/App.tsx**: application router for home, dashboard, templates, create, and portfolio detail routes
- **src/pages/Home.tsx**: landing page with product positioning, stats, and template discovery
- **src/pages/Dashboard.tsx**: portfolio operations view with status metrics and record table
- **src/pages/Templates.tsx**: template marketplace route
- **src/pages/CreatePortfolio.tsx**: route-level portfolio creation workflow
- **src/pages/Portfolio.tsx**: portfolio detail page that fetches a portfolio by ID
- **src/features/auth/components/LoginButton.tsx**: demo login/logout UI connected to auth state
- **src/features/templates/components/TemplateGrid.tsx**: template catalog UI backed by the template API with local fallback data
- **src/features/dashboard/components/DashboardMetrics.tsx**: portfolio count, verification, and pending-state metrics
- **src/features/dashboard/components/PortfolioTable.tsx**: portfolio records table with status badges and detail links
- **src/features/portfolio/components/PortfolioEditor.tsx**: validated metadata form, IPFS upload, and portfolio creation flow
- **src/features/portfolio/components/PortfolioStatusCard.tsx**: portfolio status, CID, and timestamp summary
- **src/features/verification/components/VerificationChecklist.tsx**: verification process detail view for portfolio pages
- **src/components/forms/FormField.tsx**: reusable accessible text input and textarea wrapper
- **src/components/ui/LinkButton.tsx**: router-link button primitive for navigation actions
- **src/domain/portfolio/status.ts**: portfolio sorting, status counts, and verification-rate helpers
- **src/services/http/client.ts**: Axios client configuration
- **src/services/portfolio/portfolioApi.ts**: portfolio endpoint wrapper
- **src/services/templates/templateApi.ts**: template endpoint wrapper
- **src/services/credentials/credentialApi.ts**: credential endpoint wrapper
- **src/services/proof/proofApi.ts**: proof-of-work endpoint wrapper
- **src/services/ipfs/ipfsService.ts**: file and JSON upload helpers for IPFS-compatible APIs
- **src/services/stellar/stellarService.ts**: Stellar network helpers, keypair creation, transaction signing, and address validation
- **src/store/authStore.ts**: Zustand auth state
- **src/store/portfolioStore.ts**: Zustand portfolio collection state
- **src/types/index.ts**: shared frontend TypeScript interfaces

## Folder Platform Model

Folder is designed around portfolios, templates, credentials, and proof-of-work records.

| Model | Frontend role |
| --- | --- |
| **Portfolio** | User-owned portfolio record with template ID, IPFS metadata CID, status, and timestamps |
| **Template** | Reusable portfolio schema with creator, description, and XLM price |
| **Credential** | Linked external identity or work signal from GitHub, LinkedIn, or on-chain sources |
| **ProofOfWork** | On-chain transaction hash and amount recorded against a portfolio |
| **User** | Stellar-address-based user object with optional profile fields and portfolios |

## API Integration

The frontend expects a backend API at `VITE_API_URL` and currently wraps these endpoints:

### Portfolio Endpoints

- `POST /portfolios` - create a portfolio from `templateId` and `metadataCid`
- `GET /portfolios/:id` - fetch one portfolio
- `PATCH /portfolios/:id` - update portfolio metadata CID
- `GET /portfolios` - list portfolios
- `POST /portfolios/:id/verify` - trigger portfolio verification

### Template Endpoints

- `POST /templates` - register a template
- `GET /templates` - list templates
- `GET /templates/:id` - fetch one template
- `POST /templates/:id/purchase` - purchase a template

### Credential Endpoints

- `POST /portfolios/:portfolioId/credentials` - link a credential
- `POST /portfolios/:portfolioId/credentials/:credentialId/verify` - verify a credential
- `GET /portfolios/:portfolioId/credentials` - list credentials for a portfolio

### Proof-of-Work Endpoints

- `POST /portfolios/:portfolioId/proof` - add transaction-based proof of work
- `GET /portfolios/:portfolioId/proof` - list proof-of-work records for a portfolio

## Portfolio Lifecycle — Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as Folder Frontend
    participant IPFS as IPFS API
    participant API as Folder API
    participant Contract as Soroban Contract
    participant Stellar as Stellar Network

    rect rgb(235, 245, 255)
        Note over User,API: Template Discovery
        User->>UI: Open app
        UI->>API: GET /templates
        API-->>UI: Template list
        UI-->>User: Display available templates
    end

    rect rgb(245, 235, 255)
        Note over User,API: Portfolio Creation
        User->>UI: Fill portfolio form
        UI->>IPFS: Upload metadata JSON
        IPFS-->>UI: metadata CID
        UI->>API: POST /portfolios
        API->>Contract: Create/update portfolio state
        Contract->>Stellar: Persist contract transaction
        API-->>UI: Portfolio record
    end

    rect rgb(240, 255, 240)
        Note over User,API: Verification
        User->>UI: Link credential or proof
        UI->>API: Credential/proof request
        API->>Contract: Record verification result when applicable
        API-->>UI: Updated portfolio status
    end
```

## Portfolio State Machine

Portfolio records use the following frontend status values:

```
┌──────────────┐
│   created    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ credentials_pending  │
└──────┬───────────────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│   verified   │      │  unverified  │
└──────────────┘      └──────────────┘
```

## Repository Structure

This repository contains the Folder web frontend only. Contract, backend, and deployment infrastructure are expected to live outside this repo.

```
Indexer-Frontend/
│
├── README.md                    ← This file
├── package.json                 ← npm scripts and frontend dependencies
├── package-lock.json            ← locked npm dependency graph
├── .env.example                 ← browser-exposed configuration template
├── .eslintrc.cjs                ← ESLint rules for TypeScript source
├── .gitignore                   ← ignored local, dependency, and build artifacts
├── index.html                   ← Vite HTML entry point
├── vite.config.ts               ← Vite, React plugin, alias, and dev proxy config
├── tsconfig.json                ← TypeScript project configuration
├── tsconfig.node.json           ← TypeScript config for Vite/node-side files
│
├── src/
│   ├── App.tsx                  ← route definitions
│   ├── main.tsx                 ← React mount entry point
│   ├── config/                  ← route and environment normalization
│   ├── constants/               ← navigation and status labels
│   ├── data/                    ← local development fixtures and static product data
│   │   └── fixtures/            ← dashboard fallback portfolio records
│   ├── domain/
│   │   └── portfolio/           ← pure portfolio aggregation and sorting helpers
│   ├── features/                ← feature-specific UI modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── home/
│   │   ├── portfolio/
│   │   ├── templates/
│   │   └── verification/
│   ├── hooks/                   ← reusable React hooks
│   ├── layouts/                 ← app shell, header, footer, and page container
│   ├── components/
│   │   ├── forms/               ← reusable accessible form fields
│   │   └── ui/                  ← shared UI primitives
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Home.tsx
│   │   ├── Templates.tsx
│   │   ├── CreatePortfolio.tsx
│   │   └── Portfolio.tsx
│   ├── services/
│   │   ├── credentials/
│   │   ├── http/
│   │   ├── ipfs/
│   │   ├── portfolio/
│   │   ├── proof/
│   │   ├── stellar/
│   │   └── templates/
│   ├── store/
│   │   ├── authStore.ts
│   │   └── portfolioStore.ts
│   └── types/
│       └── index.ts
│
└── dist/                        ← production build output when generated
```

Additional implementation notes are available in `docs/architecture.md`, `docs/configuration.md`, `docs/development.md`, and `docs/security.md`.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Update `.env` for your local backend, Stellar network, deployed Folder contract, and IPFS endpoint.

### 3. Run the development server

```bash
npm run dev
```

The Vite dev server runs on port `3000` by default.

### 4. Build for production

```bash
npm run build
```

The production bundle is written to `dist/`.

### 5. Preview the production build

```bash
npm run preview
```

## Configuration

Folder Frontend uses Vite environment variables. Values prefixed with `VITE_` are exposed to browser code, so do not place secrets in them.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL for the Folder backend API. Defaults to `http://localhost:3001` in the API client. |
| `VITE_STELLAR_NETWORK` | Stellar network name used by frontend helpers. Supported values are `testnet` and `mainnet`; defaults to `testnet`. |
| `VITE_FOLDER_CONTRACT_ID` | Deployed Folder Soroban contract ID used by frontend Stellar helpers. |
| `VITE_IPFS_API_URL` | IPFS API/gateway base URL used for file upload and CID resolution. |
| `VITE_GITHUB_API_URL` | GitHub API base URL reserved for credential-related integrations. |
| `VITE_LINKEDIN_API_URL` | LinkedIn API base URL reserved for credential-related integrations. |

### Dev Proxy

`vite.config.ts` includes a development proxy from `/api` to `VITE_API_URL` or `http://localhost:3001`, rewriting `/api/*` to `/*`. The current API client uses `VITE_API_URL` directly.

## Scripts

```bash
npm run dev          # start the Vite development server
npm run build        # create a production build
npm run preview      # preview the production build locally
npm run lint         # run ESLint over src/**/*.ts and src/**/*.tsx
npm run type-check   # run TypeScript without emitting files
```

## Dependencies

### Runtime

- `react` and `react-dom` - UI rendering
- `react-router-dom` - browser routing
- `axios` - HTTP client for the Folder API
- `zustand` - client-side state management
- `stellar-sdk` - Stellar keypair, address, and transaction helper support

### Development

- `vite` and `@vitejs/plugin-react` - local dev server and production bundling
- `typescript` - static typing
- `eslint`, `@typescript-eslint/parser`, and `@typescript-eslint/eslint-plugin` - linting support
- `@types/react` and `@types/react-dom` - React type definitions

## Testing and Quality Checks

This repo currently defines linting and TypeScript validation scripts:

```bash
npm run lint
npm run type-check
```

There is no test runner configured in `package.json` yet. Add one before documenting test commands such as `npm test`.

## Security Notes

1. **No browser secrets**: Vite variables are public in the built app. Keep private keys and privileged API credentials on the backend.
2. **Wallet signing boundary**: `stellarService.signTransaction` signs with a provided keypair. Production wallet/passkey integrations should avoid exposing raw secret keys to frontend state.
3. **Contract ID validation**: configure `VITE_FOLDER_CONTRACT_ID` per network and verify it before production builds.
4. **IPFS endpoint trust**: `VITE_IPFS_API_URL` controls upload and read paths. Use a trusted pinning/API provider for production.
5. **API authorization**: this frontend assumes the backend enforces ownership, credential verification rules, template purchase rules, and portfolio mutation permissions.

## Roadmap

This roadmap reflects the current repository state. Checked items are implemented in this frontend; unchecked items still need production-ready implementation or integration work.

### Phase 1: Frontend Foundation

- [x] Vite React TypeScript app
- [x] App shell with header, footer, and page container layouts
- [x] Home, dashboard, templates, create portfolio, and portfolio detail routes
- [x] Template grid and card components
- [x] Portfolio editor component with field-level validation
- [x] Portfolio status detail card
- [x] Verification checklist detail view
- [x] Dashboard metrics and portfolio records table
- [x] Reusable UI primitives and accessible form field wrapper
- [x] Zustand auth and portfolio stores
- [x] Local template and portfolio fallback fixtures for development without a backend
- [x] Production Vite build output generated in `dist/`

### Phase 2: Wallet and Identity UX

- [x] Demo Stellar identity creation for local auth-state development
- [ ] Replace placeholder login flow with production Stellar wallet/passkey onboarding
- [ ] Persist authenticated user session safely
- [ ] Add account/network switching states
- [ ] Add transaction signing UX that does not expose raw secret keys to frontend state

### Phase 3: Portfolio Creation

- [x] Connect template selection to portfolio editor routing through `?template=`
- [x] Upload portfolio metadata JSON through the IPFS service
- [x] Submit created metadata CIDs to the portfolio API
- [x] Add required-field and URL validation for portfolio metadata forms
- [x] Improve portfolio creation error states with API error normalization
- [ ] Add schema-driven form rendering from template definitions
- [ ] Add portfolio metadata preview before IPFS upload
- [ ] Redirect to the created portfolio detail route after successful creation when the backend returns the record ID

### Phase 4: Dashboard and Portfolio Operations

- [x] List portfolios through the portfolio API
- [x] Provide local dashboard fallback records when the API is unavailable
- [x] Display portfolio counts, pending status count, verified count, and verification rate
- [x] Sort portfolio records by most recently updated
- [x] Link dashboard rows to portfolio detail routes
- [ ] Add filtering and search for portfolio records
- [ ] Add dashboard actions for verify, update metadata, and copy CID

### Phase 5: Verification and Marketplace

- [x] Document credential and proof-of-work endpoint wrappers
- [x] Add portfolio verification status detail views
- [ ] Add credential linking UI
- [ ] Add proof-of-work submission UI
- [ ] Add template purchase flow
- [ ] Add verification retry and audit-history states

## License

No license file is present in this repository at the time of this README update. Add a `LICENSE` file before publishing license claims.

## Support

For issues and questions, use the repository issue tracker configured for this project.
