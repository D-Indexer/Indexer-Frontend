# ADR 0002: Shared validation package

## Status

Accepted, 2026-11-23.

## Context

Folder-name and CID rules were hand-mirrored from Indexer-Contract `src/validation.rs` in
`src/utils/validation.ts` and `src/services/ipfs/cid.ts`, and Indexer-Backend keeps its own copy.
Copies drift silently.

## Decision

- The rules live in one framework-free TypeScript package, `@folder/validation`
  (`packages/validation`), consumed here as an npm workspace. Local copies are deleted.
- Correctness is defined by the contract: Indexer-Contract's test run exports
  `vectors/contract-vectors.json` (`{ input, valid, reason? }` entries for `folderName` and `cid`).
  The package's `vectors.test.ts` must accept and reject exactly what the contract does.
  The vectors file is committed so CI here does not need the Rust toolchain.
- Indexer-Backend consumes the same package (git dependency on this workspace, or the published
  package once it is released to npm).

## Versioning and release coordination

- The package follows semver. A contract rule change is a **major** bump; adding helpers is minor.
- Order of a rule change: (1) contract PR updates `validation.rs` and regenerates the vectors;
  (2) copy the vectors here — `vectors.test.ts` fails until the TS rules match; (3) bump the package
  version and release; (4) bump it in Indexer-Backend. Frontend and backend must not ship a version
  whose vectors are newer than the deployed contract.
- `vectors/contract-vectors.json` carries a `source` field; keep it pointing at the contract commit
  the vectors were generated from.

## Consequences

One implementation to review and test. Contract changes need a coordinated release, which the
vectors test makes explicit instead of letting drift go unnoticed.
