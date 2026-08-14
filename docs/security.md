# Security Notes

- Keep signing keys, admin keys, and service credentials out of the browser.
- Treat every `VITE_` variable as public.
- Validate portfolio ownership and template purchases on the backend and contract.
- Use a trusted IPFS API or pinning provider in production.
- Avoid storing raw wallet secrets in Zustand or local storage.
