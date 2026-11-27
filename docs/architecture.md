# Architecture

```
Browser (this repo)
  ├─ Freighter ── signs transactions
  ├─ Soroban RPC ── simulate / submit / poll; read-only verify_portfolio, get_portfolio
  ├─ Indexer-Backend ── GET /folders, /portfolios, /templates; POST /upload (pins to IPFS)
  └─ IPFS gateway ── reads portfolio and template JSON (verified against the CID)
```

## Layers

| Layer | Responsibility |
| --- | --- |
| `src/main.tsx` | Renders `ConfigErrorScreen` if `envErrors` is non-empty, otherwise the router and `App`. |
| `src/config/env.ts` | Parses and validates `VITE_*` variables (pure `parseEnv`, unit-tested). |
| `src/services/data/folderData.ts` | The only read path for Folder data: backend + IPFS, or demo fixtures when `VITE_DEMO_MODE=true`. Errors propagate. |
| `src/services/stellar/stellarService.ts` | Contract calls: build → simulate → `assembleTransaction` → sign → `sendTransaction` → `pollTransaction`. Read-only calls use simulation. |
| `src/services/stellar/freighterWallet.ts` | Freighter wrapper with typed errors. |
| `src/services/stellar/contractErrors.ts` | `ContractError` code → message mapping. |
| `src/services/ipfs/` | Backend upload, gateway reads, contract CID rules, raw CIDv1 computation. |
| `src/services/context/ServicesContext.tsx` | React Context for dependency injection of services (`folderData`, `freighterWallet`, `ipfsService`, `stellarService`). |
| `src/store/walletStore.ts` | Wallet state (address, network, status). |
| `src/features/*` | Wallet button and gate, folder overview and claim form, portfolio form, transaction status, public page and template layouts. |

## Dependency Injection (`ServicesProvider`)

To decouple components and hooks from module singletons and simplify test isolation, the application provides services via `ServicesProvider` and `useServices()`.

In production:
- `AppLayout` mounts `<ServicesProvider>` wrapping all routes with `defaultServices`.
- Hooks (`useFolder`, `usePortfolio`, `useTemplates`, `useContractTx`, `usePublicPortfolio`) consume services via `useServices()`.

In tests:
- Tests use the `renderWithServices(ui, { folderData: fakeData })` helper.
- No `vi.mock` module patching or `restoreMocks` is required for injected service dependencies.

## Trust model

- The **contract** is the source of truth. The public page loads content by the CID returned from
  `get_portfolio` and shows "Verified on Stellar" only when `verify_portfolio` returns true.
- The **indexer** is a cache used to find folders by name or owner. If it lags behind the chain, the
  on-chain CID wins.
- **IPFS content** is hashed and compared with its CID whenever the CID is a raw CIDv1 (what the
  backend produces for single-block files).
- The browser holds no secrets; uploads go through the backend.

## Flows

Sequence diagrams for the four user-facing flows. They are drawn from the code in
`src/features/*`, `src/services/stellar/stellarService.ts`, `src/services/ipfs/ipfsService.ts` and
`src/services/data/folderData.ts`; keep them in sync when those change.

Trust boundaries (identical in every diagram):

- **TB1 — Browser ↔ Freighter**: the browser never sees a secret key; Freighter signs only what the
  user approves, for the passphrase the app passes in.
- **TB2 — Browser ↔ Soroban RPC / contract**: the contract is the source of truth. Simulation and
  read-only calls are untrusted hints until the transaction is final on-chain.
- **TB3 — Browser ↔ Indexer-Backend**: the indexer is a cache and an upload relay; it is never
  trusted for ownership or content integrity.
- **TB4 — Browser ↔ IPFS gateway**: content is untrusted until its bytes are hashed and compared
  with the CID (raw CIDv1 only).

### Claim folder (`claim_folder`)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as ClaimFolderForm<br/>(src/features/folder)
    participant Guard as useWalletGuard
    participant Tx as useContractTx
    participant Svc as stellarService
    participant RPC as Soroban RPC
    participant W as Freighter
    participant C as Folder contract

    User->>UI: submit folder name
    UI->>UI: validateFolderName + toFolderName (mirrors contract rules)
    alt invalid name
        UI-->>User: field error, focus #folder-name (no network call)
    else valid name
        UI->>Guard: ready?
        Guard-->>UI: blockedReason (demo mode / not connected / not testnet)
        alt blocked
            UI-->>User: blocked reason, no transaction
        else ready
            UI->>Tx: run(owner, claim_folder)
            Tx->>Svc: invoke(owner, write, sign)
            Note over Svc,RPC: TB2 — simulation is a hint, not proof
            Svc->>RPC: getAccount(owner)
            alt account not funded
                RPC-->>Svc: not found
                Svc-->>Tx: TransactionError (fund with Friendbot)
                Tx-->>UI: stage failed + message
                UI-->>User: error with retry (resubmit form)
            else account exists
                Svc->>RPC: simulateTransaction(claim_folder)
                alt simulation error (e.g. #3 FolderNameTaken, #16 FolderAlreadyClaimed, #9 InvalidFolderName)
                    RPC-->>Svc: Error(Contract, #N)
                    Svc-->>Tx: TransactionError(describeContractError)
                    Tx-->>UI: stage failed + message
                    UI-->>User: error, name can be changed and retried
                else simulation needs restore
                    RPC-->>Svc: isSimulationRestore
                    Svc-->>Tx: TransactionError (state expired, try again later)
                    Tx-->>UI: stage failed
                    UI-->>User: retry later
                else simulation ok
                    Svc->>Svc: assembleTransaction
                    Note over Svc,W: TB1 — signing boundary
                    Svc->>W: signTransaction(xdr, address, passphrase)
                    alt user rejects
                        W-->>Svc: WalletError
                        Svc-->>Tx: error
                        Tx-->>UI: stage failed
                        UI-->>User: rejection message, retry allowed
                    else signed
                        W-->>Svc: signed XDR
                        Svc->>RPC: sendTransaction
                        alt ERROR / TRY_AGAIN_LATER
                            RPC-->>Svc: status + hash
                            Svc-->>Tx: TransactionError (busy → retry, or rejected)
                            Tx-->>UI: stage failed + hash
                            UI-->>User: error + stellar.expert link
                        else PENDING
                            Svc->>RPC: pollTransaction (30 attempts)
                            alt SUCCESS
                                RPC-->>Svc: ledger
                                Svc-->>Tx: { hash, ledger }
                                Tx-->>UI: stage done
                                UI-->>User: claimed, folder overview refreshed
                            else FAILED
                                RPC-->>Svc: diagnostic events
                                Svc-->>Tx: TransactionError(code from events, hash)
                                Tx-->>UI: stage failed + hash
                                UI-->>User: error + stellar.expert link
                            else not confirmed in time
                                Svc-->>Tx: TransactionError(pending, hash)
                                Tx-->>UI: stage failed + hash
                                UI-->>User: "check status on stellar.expert"
                            end
                        end
                    end
                end
            end
        end
    end
```

### Mint portfolio (`mint_portfolio`)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as PortfolioForm<br/>(src/features/portfolio)
    participant Tx as useContractTx
    participant IPFS as ipfsService
    participant BE as Indexer-Backend
    participant Svc as stellarService
    participant RPC as Soroban RPC
    participant W as Freighter
    participant C as Folder contract

    User->>UI: submit portfolio content
    UI->>UI: validate fields (name, bio, links, template)
    alt invalid
        UI-->>User: field errors, focus first invalid (no network call)
    else valid
        UI->>Tx: run(owner, prepare)
        Tx->>IPFS: uploadPortfolioContent(content)
        Note over IPFS,BE: TB3 — backend is an upload relay, not a trust anchor
        IPFS->>BE: POST /upload (portfolio.json)
        alt upload rejected (400 unsupported type) or network error
            BE-->>IPFS: error
            IPFS-->>Tx: IpfsError (hint / message)
            Tx-->>UI: stage failed
            UI-->>User: error, content kept, retry allowed
        else CID returned
            BE-->>IPFS: { cid }
            IPFS->>IPFS: isValidContractCid + computeRawCidV1(bytes) === cid
            alt CID invalid or hash mismatch
                IPFS-->>Tx: IpfsError (contract would reject / content mismatch)
                Tx-->>UI: stage failed
                UI-->>User: error, retry allowed
            else CID valid
                IPFS-->>Tx: cid
                Tx->>Svc: invoke(owner, mint_portfolio(templateId, cid), sign)
                Note over Svc,RPC: TB2 — simulation is a hint, not proof
                Svc->>RPC: getAccount + simulateTransaction(mint_portfolio)
                alt simulation error (#4 FolderNotFound, #6 TemplateNotFound, #8 InvalidCID, #13 PortfolioAlreadyMinted)
                    RPC-->>Svc: Error(Contract, #N)
                    Svc-->>Tx: TransactionError(describeContractError)
                    Tx-->>UI: stage failed
                    UI-->>User: error (e.g. "update it instead"), retry allowed
                else simulation needs restore
                    RPC-->>Svc: isSimulationRestore
                    Svc-->>Tx: TransactionError (state expired)
                    Tx-->>UI: stage failed
                    UI-->>User: retry later
                else simulation ok
                    Svc->>Svc: assembleTransaction
                    Note over Svc,W: TB1 — signing boundary
                    Svc->>W: signTransaction(xdr, address, passphrase)
                    alt user rejects
                        W-->>Svc: WalletError
                        Svc-->>Tx: error
                        Tx-->>UI: stage failed
                        UI-->>User: rejection message, retry allowed
                    else signed
                        W-->>Svc: signed XDR
                        Svc->>RPC: sendTransaction
                        alt ERROR / TRY_AGAIN_LATER
                            RPC-->>Svc: status + hash
                            Svc-->>Tx: TransactionError (busy → retry, or rejected)
                            Tx-->>UI: stage failed + hash
                            UI-->>User: error + stellar.expert link
                        else PENDING
                            Svc->>RPC: pollTransaction (30 attempts)
                            alt SUCCESS
                                RPC-->>Svc: ledger
                                Svc-->>Tx: { hash, ledger }
                                Tx-->>UI: stage done
                                UI-->>User: minted, public page now verifies
                            else FAILED
                                RPC-->>Svc: diagnostic events
                                Svc-->>Tx: TransactionError(code from events, hash)
                                Tx-->>UI: stage failed + hash
                                UI-->>User: error + stellar.expert link
                            else not confirmed in time
                                Svc-->>Tx: TransactionError(pending, hash)
                                Tx-->>UI: stage failed + hash
                                UI-->>User: "check status on stellar.expert"
                            end
                        end
                    end
                end
            end
        end
    end
```

### Update portfolio (`update_portfolio`)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as PortfolioForm<br/>(src/features/portfolio)
    participant Data as folderData
    participant IPFS as ipfsService
    participant BE as Indexer-Backend
    participant Svc as stellarService
    participant RPC as Soroban RPC
    participant W as Freighter
    participant C as Folder contract

    Note over UI,Data: TB4 — existing content is untrusted until CID-checked
    UI->>Data: getPortfolioContent(portfolio.ipfsCid)
    Data->>IPFS: fetchJson(cid)
    alt gateway unreachable / not pinned / hash mismatch / bad JSON
        IPFS-->>Data: IpfsError
        Data-->>UI: error
        UI-->>User: notice "current content could not be loaded; publishing replaces it"
    else content ok
        IPFS-->>Data: PortfolioContent
        Data-->>UI: prefilled form
    end

    User->>UI: submit changes
    UI->>UI: validate fields
    alt invalid
        UI-->>User: field errors, focus first invalid (no network call)
    else valid
        UI->>IPFS: uploadPortfolioContent(content)
        Note over IPFS,BE: TB3 — backend is an upload relay, not a trust anchor
        IPFS->>BE: POST /upload (portfolio.json)
        alt upload failed
            BE-->>IPFS: error
            IPFS-->>UI: IpfsError
            UI-->>User: error, retry allowed (old CID still on-chain)
        else CID returned
            BE-->>IPFS: { cid }
            IPFS->>IPFS: isValidContractCid + raw CIDv1 hash check
            alt CID invalid or mismatch
                IPFS-->>UI: IpfsError
                UI-->>User: error, retry allowed (old CID still on-chain)
            else CID valid
                IPFS-->>UI: cid
                UI->>Svc: invoke(owner, update_portfolio(cid), sign)
                Note over Svc,RPC: TB2 — simulation is a hint, not proof
                Svc->>RPC: getAccount + simulateTransaction(update_portfolio)
                alt simulation error (#4 FolderNotFound, #5 PortfolioNotFound, #8 InvalidCID, #7 Unauthorized)
                    RPC-->>Svc: Error(Contract, #N)
                    Svc-->>UI: TransactionError(describeContractError)
                    UI-->>User: error, retry allowed (old CID still on-chain)
                else simulation needs restore
                    RPC-->>Svc: isSimulationRestore
                    Svc-->>UI: TransactionError (state expired)
                    UI-->>User: retry later
                else simulation ok
                    Svc->>Svc: assembleTransaction
                    Note over Svc,W: TB1 — signing boundary
                    Svc->>W: signTransaction(xdr, address, passphrase)
                    alt user rejects
                        W-->>Svc: WalletError
                        Svc-->>UI: error
                        UI-->>User: rejection message, retry allowed
                    else signed
                        W-->>Svc: signed XDR
                        Svc->>RPC: sendTransaction
                        alt ERROR / TRY_AGAIN_LATER
                            RPC-->>Svc: status + hash
                            Svc-->>UI: TransactionError (busy → retry, or rejected)
                            UI-->>User: error + stellar.expert link
                        else PENDING
                            Svc->>RPC: pollTransaction (30 attempts)
                            alt SUCCESS
                                RPC-->>Svc: ledger
                                Svc-->>UI: { hash, ledger }
                                UI-->>User: updated, public page shows the new CID
                            else FAILED
                                RPC-->>Svc: diagnostic events
                                Svc-->>UI: TransactionError(code from events, hash)
                                UI-->>User: error + stellar.expert link (old CID still on-chain)
                            else not confirmed in time
                                Svc-->>UI: TransactionError(pending, hash)
                                UI-->>User: "check status on stellar.expert"
                            end
                        end
                    end
                end
            end
        end
    end
```

### Public verification (`verify_portfolio` / `get_portfolio`)

```mermaid
sequenceDiagram
    autonumber
    actor Visitor
    participant Page as PublicPortfolioPage<br/>(src/features/public-portfolio)
    participant Hook as loadPublicPortfolio
    participant Data as folderData
    participant BE as Indexer-Backend
    participant Svc as stellarService
    participant RPC as Soroban RPC
    participant C as Folder contract
    participant IPFS as ipfsService
    participant GW as IPFS gateway

    Visitor->>Page: open /<name>.folder
    Page->>Hook: loadPublicPortfolio(name)
    Note over Hook,BE: TB3 — indexer is a cache, never proof of ownership
    Hook->>Data: getFolderByName(name)
    Data->>BE: GET /folders?name=…
    alt not found
        BE-->>Data: 404
        Data-->>Hook: null
        Hook-->>Page: null
        Page-->>Visitor: not-found state
    else indexer error
        BE-->>Data: error
        Data-->>Hook: ApiError
        Hook-->>Page: error
        Page-->>Visitor: error state with retry
    else folder found
        BE-->>Data: Folder
        Data-->>Hook: folder
        Hook->>Data: getPortfolio(owner) (indexed hint)
        Hook->>Svc: verifyPortfolio(owner) + getOnChainPortfolio(owner)
        Note over Svc,RPC: TB2 — contract is the source of truth
        Svc->>RPC: simulate verify_portfolio(owner)
        Svc->>RPC: simulate get_portfolio(owner)
        alt demo mode
            Hook->>Hook: verification = demo (no chain call)
        else chain unreachable / simulation error
            RPC-->>Svc: error
            Svc-->>Hook: Error
            Hook->>Hook: verification = unavailable(reason), cid = indexed CID
            Hook-->>Page: portfolio with "verification unavailable"
            Page-->>Visitor: content shown, badge says verification unavailable
        else verified = true and get_portfolio returns a portfolio
            RPC-->>Svc: true + { ipfs_cid, template_id }
            Svc-->>Hook: on-chain CID wins over indexed CID
            Hook->>Hook: verification = verified(onChainCid)
            Hook->>IPFS: fetchJson(onChainCid)
            Note over IPFS,GW: TB4 — gateway content is untrusted until hashed
            IPFS->>GW: GET /ipfs/<cid>
            alt gateway error / hash mismatch / bad JSON
                GW-->>IPFS: error or mismatched bytes
                IPFS-->>Hook: IpfsError
                Hook->>Hook: contentError set, verification stays verified
                Hook-->>Page: portfolio with content error
                Page-->>Visitor: "Verified on Stellar" + content error with retry
            else content ok
                GW-->>IPFS: bytes
                IPFS->>IPFS: computeRawCidV1(bytes) === cid (raw CIDv1 only)
                IPFS-->>Hook: PortfolioContent
                Hook-->>Page: portfolio verified + content
                Page-->>Visitor: "Verified on Stellar" + rendered portfolio
            end
        else verified = false or no portfolio (#5 PortfolioNotFound)
            RPC-->>Svc: false / null
            Svc-->>Hook: not minted
            Hook->>Hook: verification = not_minted
            Hook-->>Page: portfolio without content
            Page-->>Visitor: "not minted yet" state
        end
    end
```

## Decisions

See [docs/adr/](adr/).
