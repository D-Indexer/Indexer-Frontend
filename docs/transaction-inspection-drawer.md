# Transaction inspection drawer

The transaction status component exposes an opt-in native `<details>` disclosure after a contract transaction is prepared. It contains the prepared XDR, transaction hash, and requested contract method, with a Stellar Laboratory XDR viewer link. Native disclosure semantics make it keyboard and screen-reader accessible without adding a custom focus trap.

The data is diagnostic only: it is captured before signing and contains no wallet secret. Future footprint, authorization entry, and resource-limit decoders can extend the same prepared-transaction object.
