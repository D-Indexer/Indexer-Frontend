# Simulation authorization validation

Before Freighter is asked to sign a simulation-assembled transaction, the frontend requires exactly one `invokeHostFunction` operation. Any unexpected operation is rejected with `TransactionError` code `unexpected_auth`; signing and submission do not occur.

The next validation layer should also decode every authorization entry, require a source-account credential for the connected owner, compare the root invocation with the intended Folder method and arguments, and reject unallowlisted sub-invocations.
