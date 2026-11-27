# ADR 0002: Canonical JSON for Portfolio Documents

## Status

Accepted.

## Context

`serializePortfolioContent` used `JSON.stringify(content, null, 2)`, so key order followed object
construction order. Semantically identical documents could get different CIDs, causing needless
`update_portfolio` transactions and unreliable content equality checks.

## Decision

Writers serialise portfolio documents with RFC 8785 (JCS) via `src/services/ipfs/canonicalJson.ts`:
keys sorted by UTF-16 code units, ECMAScript number formatting, no insignificant whitespace.
`schema_version` stays at 1: readers only `JSON.parse` the bytes and the CID is verified against the
fetched bytes, so previously published pretty-printed documents continue to render unchanged.

## Consequences

- Identical content yields an identical CID regardless of key order.
- New documents differ byte-wise from older ones, so the first republish of unchanged content gets a new CID.
