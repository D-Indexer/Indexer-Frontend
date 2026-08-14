# Frontend Conventions

## Code Placement

- Put route composition in `src/pages/`.
- Put product workflow UI in `src/features/<feature>/`.
- Put reusable primitives in `src/components/ui/` or `src/components/forms/`.
- Put pure calculations in `src/domain/<domain>/`.
- Put external integrations in `src/services/<integration>/`.

## Quality Bar

Before opening a pull request, run:

```bash
npm run type-check
npm run lint
npm run build
```

UI changes should include screenshots and mention responsive, keyboard, loading, empty, and error states.
