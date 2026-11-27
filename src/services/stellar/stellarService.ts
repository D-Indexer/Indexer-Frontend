import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  StrKey,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'
import { env } from '@/config/env'
import { describeContractError, extractContractErrorCode, getContractErrorCodeString } from './contractErrors'
import { getNetworkPassphrase } from './network'
import { WalletError } from './freighterWallet'

/** Stages reported while a write is in flight, so the UI can say what is happening. */
export type TxStage = 'preparing' | 'signing' | 'submitting' | 'confirming'

export type TxSigner = (xdr: string, address: string, networkPassphrase: string) => Promise<string>

export type FolderWrite =
  | { method: 'claim_folder'; folderName: string }
  | { method: 'mint_portfolio'; templateId: number; ipfsCid: string }
  | { method: 'update_portfolio'; ipfsCid: string }
  | { method: 'register_template'; templateId: number; metadataUri: string }

export interface TxResult {
  hash: string
  ledger: number
  events?: FolderEvent[]
}
export interface PreparedTransactionDetails { xdr: string; hash: string; method: FolderWrite['method'] }

export class TransactionError extends Error {
  readonly code?: string
  readonly docsAnchor?: string

  constructor(
    message: string,
    readonly options: { code?: 'unexpected_auth'; contractErrorCode?: number; hash?: string; pending?: boolean } = {},
  ) {
    super(message)
    this.name = 'TransactionError'
    this.code = options.code ?? (options.contractErrorCode ? getContractErrorCodeString(options.contractErrorCode) : undefined)
    this.docsAnchor = options.docsAnchor ?? (this.code ? this.code.toLowerCase() : undefined)
  }
}

const assertNotAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new TransactionError('Your wallet changed during this action. Nothing was signed.', { code: 'wallet_changed' } as any)
}

/** Source for read-only simulations; it never signs or submits anything. */
const READ_ONLY_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

let pool: ReturnType<typeof createRpcPool> | null = null
const getPool = () => {
  pool ??= createRpcPool(env.sorobanRpcUrls ?? [env.sorobanRpcUrl])
  return pool
}

/** Test seam: swaps the RPC server (e.g. one backed by recorded exchanges) and returns a restore fn. */
export const setSorobanServer = (next: rpc.Server | null) => {
  const previous = server
  server = next
  return () => {
    server = previous
  }
}

/** Contract method + arguments for a write; exported so tests can pin the encoded XDR. */
export const toArgs = (owner: string, write: FolderWrite): xdr.ScVal[] => {
  const ownerArg = new Address(owner).toScVal()
  switch (write.method) {
    case 'claim_folder':
      return [ownerArg, nativeToScVal(write.folderName, { type: 'string' })]
    case 'mint_portfolio':
      return [ownerArg, nativeToScVal(write.templateId, { type: 'u32' }), nativeToScVal(write.ipfsCid, { type: 'string' })]
    case 'update_portfolio':
      return [ownerArg, nativeToScVal(write.ipfsCid, { type: 'string' })]
    case 'register_template':
      return [ownerArg, nativeToScVal(write.templateId, { type: 'u32' }), nativeToScVal(write.metadataUri, { type: 'string' })]
  }
}

const errorFromText = (text: string, hash?: string) => {
  const code = extractContractErrorCode(text)
  if (code !== null) {
    return new TransactionError(describeContractError(code), { contractErrorCode: code, hash })
  }
  return null
}

const loadAccount = async (address: string) => {
  try {
    return await getPool().read((server) => server.getAccount(address))
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      throw new TransactionError(
        'This account does not exist on testnet yet. Fund it with Friendbot and try again.', { code: 'account_not_found' },
      )
    }
    throw new TransactionError(`Could not load your account from Soroban RPC: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** Builds the unsigned transaction that `invoke` simulates for a write. */
export const buildInvokeTransaction = (source: Account, owner: string, write: FolderWrite) =>
  new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: getNetworkPassphrase() })
    .addOperation(new Contract(env.folderContractId).call(write.method, ...toArgs(owner, write)))
    .setTimeout(120)
    .build()

const simulate = async (source: Account, method: string, args: xdr.ScVal[]) => {
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: getNetworkPassphrase() })
    .addOperation(new Contract(env.folderContractId).call(method, ...args))
    .setTimeout(120)
    .build()

  const simulation = await getPool().read((server) => server.simulateTransaction(tx))
  if (rpc.Api.isSimulationError(simulation)) {
    throw errorFromText(simulation.error) ?? new TransactionError(`Simulation failed: ${simulation.error.split('\n')[0]}`, { code: 'FOLDER-TX-100' })
  }
  if (rpc.Api.isSimulationRestore(simulation)) {
    throw new TransactionError('Some contract state has expired and must be restored before this call. Please try again later.', { code: 'FOLDER-TX-100' })
  }
  return { simulation, tx }
}

/** Latest ledger sequence from Soroban RPC, or null when it cannot be read (reads then skip the cache). */
const latestLedger = async (): Promise<number | null> => {
  try {
    const { sequence } = await getServer().getLatestLedger()
    return typeof sequence === 'number' ? sequence : null
  } catch {
    return null
  }
}

/** Ledger-scoped cache for read-only contract calls (`verify_portfolio`, `get_portfolio`). */
const readCache = createReadCache({ getLedger: latestLedger })

/** Runs a read-only simulation through the ledger-scoped cache, keyed by method + args XDR. */
const cachedRead = <T>(method: string, args: xdr.ScVal[], load: () => Promise<T>): Promise<T> =>
  readCache.read(readCache.key(method, args.map((arg) => arg.toXDR('base64'))), load)

/** Drops cached reads of `owner` after a write, so the next read sees the new state. */
const invalidateOwner = (owner: string) => {
  const ownerXdr = new Address(owner).toScVal().toXDR('base64')
  readCache.invalidate((key) => key.includes(ownerXdr))
}

export const stellarService = {
  getNetworkPassphrase,
  getContractId: () => env.folderContractId,
  isValidAccountAddress: (address: string) => StrKey.isValidEd25519PublicKey(address),

  /**
   * Builds, simulates and prepares a Folder contract call, has `sign` sign it (Freighter in the
   * app), submits it, and polls until it is final. Contract errors are mapped to readable messages.
   *
   * Sequence diagrams (claim, mint, update, public verification) with trust boundaries:
   * `docs/architecture.md#flows`.
   */
  invoke: async (owner: string, write: FolderWrite, sign: TxSigner, onStage?: (stage: TxStage) => void, signal?: AbortSignal): Promise<TxResult> => {
    const networkPassphrase = getNetworkPassphrase()
    onStage?.('preparing')
    const account = await loadAccount(owner)
    const { simulation, tx } = await simulate(account, write.method, toArgs(owner, write))
    const prepared = rpc.assembleTransaction(tx, simulation).build()
    const operation = prepared.operations[0] as any
    if (prepared.operations.length !== 1 || operation?.type !== 'invokeHostFunction') {
      throw new TransactionError('The RPC returned an unexpected transaction operation. Nothing was signed.', { code: 'unexpected_auth' })
    }

    assertNotAborted(signal)
    onStage?.('signing')
    const signedXdr = await sign(prepared.toXDR(), owner, networkPassphrase)

    assertNotAborted(signal)
    onStage?.('submitting')
    const signed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
    if (signed.hash().toString('hex') !== preparedHash || signed.constructor.name === 'FeeBumpTransaction') {
      throw new WalletError('The wallet returned a transaction different from the one the app prepared. Nothing was submitted.', 'tampered')
    }
    const sent = await getServer().sendTransaction(signed)
    if (sent.status === 'ERROR' || sent.status === 'TRY_AGAIN_LATER') {
      const detail = sent.errorResult ? sent.errorResult.result().switch().name : sent.status
      throw new TransactionError(
        sent.status === 'TRY_AGAIN_LATER'
          ? 'The network is busy. Please try again in a few seconds.'
          : `The network rejected the transaction (${detail}).`,
        { code: 'FOLDER-TX-101', hash: sent.hash },
      )
    }

    onStage?.('confirming')
    const final = await getPool().poll(sent.hash, { attempts: 30, sleepStrategy: rpc.BasicSleepStrategy })
    if (final.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      invalidateOwner(owner)
      return { hash: sent.hash, ledger: final.ledger }
    }
    if (final.status === rpc.Api.GetTransactionStatus.FAILED) {
      const code = findContractErrorCode(final.diagnosticEventsXdr ?? [])
      throw code !== null
        ? new TransactionError(describeContractError(code), { contractErrorCode: code, hash: sent.hash })
        : new TransactionError('The transaction failed on-chain. Open it on stellar.expert for details.', { hash: sent.hash })
    }
    throw new TransactionError('The transaction was submitted but not confirmed yet. Check its status on stellar.expert.', {
      code: 'FOLDER-TX-102',
      hash: sent.hash,
      pending: true,
    })
  },

  /** Read-only `verify_portfolio(owner)` via simulation; true when a portfolio NFT exists on-chain. */
  verifyPortfolio: async (owner: string): Promise<boolean> => {
    const args = [new Address(owner).toScVal()]
    return cachedRead('verify_portfolio', args, async () => {
      const { simulation } = await simulate(new Account(READ_ONLY_SOURCE, '0'), 'verify_portfolio', args)
      return simulation.result ? scValToNative(simulation.result.retval) === true : false
    })
  },

  /** Ledger data for proof bundles: the latest ledger and when the contract instance expires (null if unreadable). */
  getLedgerSnapshot: async (): Promise<{ latestLedger: number; liveUntilLedger: number | null }> => {
    const rpcServer = getServer()
    const latest = await rpcServer.getLatestLedger()
    let liveUntilLedger: number | null = null
    try {
      const entry = await rpcServer.getContractData(env.folderContractId, xdr.ScVal.scvLedgerKeyContractInstance())
      liveUntilLedger = entry.liveUntilLedgerSeq ?? null
    } catch {
      liveUntilLedger = null
    }
    return { latestLedger: latest.sequence, liveUntilLedger }
  },

  /** Read-only `get_portfolio(owner)`: the CID and template currently anchored on-chain. */
  getOnChainPortfolio: async (owner: string): Promise<OnChainPortfolioState | null> => {
    try {
      const { simulation } = await simulate(new Account(READ_ONLY_SOURCE, '0'), 'get_portfolio', [new Address(owner).toScVal()])
      if (!simulation.result) return null
      const value = scValToNative(simulation.result.retval) as { ipfs_cid: string; template_id: number; minted_at: bigint }
      return { ipfsCid: value.ipfs_cid, templateId: value.template_id, mintedAt: Number(value.minted_at) }
    } catch (error) {
      if (error instanceof TransactionError && error.options.contractErrorCode === 5) return null
      throw error
    }
  },

  /** Cache hit/miss counters for diagnostics. */
  readCacheMetrics: () => readCache.metrics(),

  /** Drops cached reads of `owner` (e.g. after a write made outside this service). */
  invalidateReads: (owner: string) => invalidateOwner(owner),
}

/** Finds the first contract error (`Error(Contract, #N)`) in a failed transaction's diagnostic events. */
export function findContractErrorCode(events: xdr.DiagnosticEvent[]): number | null {
  for (const event of events) {
    const body = event.event().body().v0()
    for (const value of [...body.topics(), body.data()]) {
      if (value.switch().name === 'scvError') {
        const error = value.error()
        if (error.switch().name === 'sceContract') return error.contractCode()
      }
    }
  }
  return null
}
