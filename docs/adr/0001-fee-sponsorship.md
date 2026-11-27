# ADR 0001: optional backend fee sponsorship

When `VITE_SPONSOR_ENABLED` is false, writes remain self-paid and use the normal RPC submission path. A future enabled `/sponsor` backend endpoint must accept only user-signed inner Folder-contract calls, validate the method/arguments, enforce rate limits and per-address quotas, fee-bump and submit, then return its fee-bump hash for RPC polling. Sponsorship refusal must fall back to self-paid submission and never alter the user-signed inner transaction.
