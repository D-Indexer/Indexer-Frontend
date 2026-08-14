# Development

## Commands

```bash
npm install
npm run dev
npm run type-check
npm run lint
npm run build
```

## Local API expectations

The frontend expects the Folder API to expose portfolio, template, credential, and proof endpoints documented in `README.md`.

During local development, the template grid and dashboard fall back to local starter fixtures if the API is unavailable.

## Project conventions

See `docs/contributing/frontend-conventions.md` for source placement rules and the quality checklist.
Architecture decisions are recorded under `docs/adr/`.
