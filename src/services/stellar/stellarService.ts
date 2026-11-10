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
  type xdr,
} from '@stellar/stellar-sdk'
import { env } from '@/config/env'
import { describeContractError, extractContractErrorCode } from './contractErrors'
import { getNetworkPassphrase } from './network'

/** Stages reported while a write is in flight, so the UI can say what is happening. */
export type TxStage = 'preparing' | 'signing' | 'submitting' | 'confirming'

export type TxSigner = (xdr: string, address: string, networkPassphrase: string) => Promise<string>

export type FolderWrite =
  | { method: 'claim_folder'; folderName: string }
  | { method: 'mint_portfolio'; templateId: number; ipfsCid: string }
  | { method: 'update_portfolio'; ipfsCid: string }

export interface TxResult {
  hash: string
  ledger: number
}

export class TransactionError extends Error {
  constructor(
    message: string,
    readonly options: { contractErrorCode?: number; hash?: string; pending?: boolean } = {},
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}

/** Source for read-only simulations; it never signs or submits anything. */
const READ_ONLY_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

let server: rpc.Server | null = null
const getServer = () => {
  server ??= new rpc.Server(env.sorobanRpcUrl, { allowHttp: env.sorobanRpcUrl.startsWith('http://') })
  return server
}

const toArgs = (owner: string, write: FolderWrite): xdr.ScVal[] => {
  const ownerArg = new Address(owner).toScVal()
  switch (write.method) {
    case 'claim_folder':
      return [ownerArg, nativeToScVal(write.folderName, { type: 'string' })]
    case 'mint_portfolio':
      return [ownerArg, nativeToScVal(write.templateId, { type: 'u32' }), nativeToScVal(write.ipfsCid, { type: 'string' })]
    case 'update_portfolio':
      return [ownerArg, nativeToScVal(write.ipfsCid, { type: 'string' })]
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
    return await getServer().getAccount(address)
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      throw new TransactionError(
        'This account does not exist on testnet yet. Fund it with Friendbot (https://friendbot.stellar.org/?addr=<your address>) and try again.',
      )
    }
    throw new TransactionError(`Could not load your account from Soroban RPC: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const simulate = async (source: Account, method: string, args: xdr.ScVal[]) => {
  const contractId = env.folderContractId
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: getNetworkPassphrase() })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(120)
    .build()

  const simulation = await getServer().simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw errorFromText(simulation.error) ?? new TransactionError(`Simulation failed: ${simulation.error.split('\n')[0]}`)
  }
  if (rpc.Api.isSimulationRestore(simulation)) {
    throw new TransactionError('Some contract state has expired and must be restored before this call. Please try again later.')
  }
  return { simulation, tx }
}

export const stellarService = {
  getNetworkPassphrase,
  getContractId: () => env.folderContractId,
  isValidAccountAddress: (address: string) => StrKey.isValidEd25519PublicKey(address),

  /**
   * Builds, simulates and prepares a Folder contract call, has `sign` sign it (Freighter in the
   * app), submits it, and polls until it is final. Contract errors are mapped to readable messages.
   */
  invoke: async (owner: string, write: FolderWrite, sign: TxSigner, onStage?: (stage: TxStage) => void): Promise<TxResult> => {
    const networkPassphrase = getNetworkPassphrase()
    onStage?.('preparing')
    const account = await loadAccount(owner)
    const { simulation, tx } = await simulate(account, write.method, toArgs(owner, write))
    const prepared = rpc.assembleTransaction(tx, simulation).build()

    onStage?.('signing')
    const signedXdr = await sign(prepared.toXDR(), owner, networkPassphrase)

    onStage?.('submitting')
    const signed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
    const sent = await getServer().sendTransaction(signed)
    if (sent.status === 'ERROR' || sent.status === 'TRY_AGAIN_LATER') {
      const detail = sent.errorResult ? sent.errorResult.result().switch().name : sent.status
      throw new TransactionError(
        sent.status === 'TRY_AGAIN_LATER'
          ? 'The network is busy. Please try again in a few seconds.'
          : `The network rejected the transaction (${detail}).`,
        { hash: sent.hash },
      )
    }

    onStage?.('confirming')
    const final = await getServer().pollTransaction(sent.hash, { attempts: 30, sleepStrategy: rpc.BasicSleepStrategy })
    if (final.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return { hash: sent.hash, ledger: final.ledger }
    }
    if (final.status === rpc.Api.GetTransactionStatus.FAILED) {
      const code = findContractErrorCode(final.diagnosticEventsXdr ?? [])
      throw code !== null
        ? new TransactionError(describeContractError(code), { contractErrorCode: code, hash: sent.hash })
        : new TransactionError('The transaction failed on-chain. Open it on stellar.expert for details.', { hash: sent.hash })
    }
    throw new TransactionError('The transaction was submitted but not confirmed yet. Check its status on stellar.expert.', {
      hash: sent.hash,
      pending: true,
    })
  },

  /** Read-only `verify_portfolio(owner)` via simulation; true when a portfolio NFT exists on-chain. */
  verifyPortfolio: async (owner: string): Promise<boolean> => {
    const { simulation } = await simulate(new Account(READ_ONLY_SOURCE, '0'), 'verify_portfolio', [new Address(owner).toScVal()])
    return simulation.result ? scValToNative(simulation.result.retval) === true : false
  },

  /** Read-only `get_portfolio(owner)`: the CID and template currently anchored on-chain. */
  getOnChainPortfolio: async (owner: string): Promise<{ ipfsCid: string; templateId: number; mintedAt: number } | null> => {
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
