# Live Folder contract-event updates

`useContractEvents` is a visibility-aware browser polling seam for an owner-scoped `getEvents` query. The dashboard data layer supplies a cursor-aware RPC poller; the hook pauses while the document is hidden, marks a network update when a relevant event arrives, and retries on the next bounded interval after a transient RPC failure.

Callers must retain their cursor and invalidate folder/portfolio queries after `updated` becomes true. Soroban RPC event retention is limited: a cursor older than the provider's retention window cannot recover historic events and should re-read current state instead.
