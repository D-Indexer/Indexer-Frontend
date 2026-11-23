import { Address, nativeToScVal, SorobanDataBuilder, TransactionBuilder, xdr } from '@stellar/stellar-sdk'
import { http, HttpResponse } from 'msw'
import { env } from '@/config/env'
import { getNetworkPassphrase } from '@/services/stellar/network'
import { mockDb } from '../db'

/**
 * Soroban RPC JSON-RPC responses for the calls the app makes: getLedgerEntries (account load),
 * simulateTransaction, sendTransaction and getTransaction. Contract state comes from `mockDb`.
 */
const LEDGER = 1_000

interface JsonRpcRequest {
  id: number | string
  method: string
  params: Record<string, unknown>
}

const accountEntry = (key: string) => {
  const accountId = xdr.LedgerKey.fromXDR(key, 'base64').account().accountId()
  const entry = new xdr.AccountEntry({
    accountId,
    balance: xdr.Int64.fromString('100000000000'),
    seqNum: xdr.Int64.fromString('1'),
    numSubEntries: 0,
    inflationDest: null,
    flags: 0,
    homeDomain: '',
    thresholds: new Uint8Array([1, 0, 0, 0]) as Buffer,
    signers: [],
    ext: new xdr.AccountEntryExt(0),
  })
  return { key, xdr: xdr.LedgerEntryData.account(entry).toXDR('base64'), lastModifiedLedgerSeq: LEDGER }
}

const decodeCall = (envelope: string) => {
  const tx = TransactionBuilder.fromXDR(envelope, getNetworkPassphrase())
  if (!('operations' in tx)) throw new Error('Fee bump transactions are not mocked')
  const op = tx.toEnvelope().v1().tx().operations()[0].body().invokeHostFunctionOp()
  const call = op.hostFunction().invokeContract()
  const args = call.args()
  return {
    tx,
    method: call.functionName().toString(),
    owner: Address.fromScVal(args[0]).toString(),
    args: args.slice(1),
  }
}

const returnValue = (method: string, owner: string): xdr.ScVal | string => {
  const error = mockDb.rpcErrors.get(method)
  if (error) return error
  if (method === 'verify_portfolio') return xdr.ScVal.scvBool(mockDb.chainPortfolios.has(owner))
  if (method === 'get_portfolio') {
    const portfolio = mockDb.chainPortfolios.get(owner)
    if (!portfolio) return 'HostError: Error(Contract, #5)'
    return nativeToScVal(
      { ipfs_cid: portfolio.ipfsCid, minted_at: BigInt(portfolio.mintedAt), template_id: portfolio.templateId },
      { type: { ipfs_cid: ['symbol', 'string'], minted_at: ['symbol', 'u64'], template_id: ['symbol', 'u32'] } },
    )
  }
  return xdr.ScVal.scvVoid()
}

const simulate = ({ transaction }: { transaction: string }) => {
  const { method, owner } = decodeCall(transaction)
  const value = returnValue(method, owner)
  if (typeof value === 'string') return { error: value, events: [], latestLedger: LEDGER }
  return {
    latestLedger: LEDGER,
    minResourceFee: '100',
    transactionData: new SorobanDataBuilder().build().toXDR('base64'),
    results: [{ auth: [], xdr: value.toXDR('base64') }],
    events: [],
  }
}

const applyWrite = (envelope: string) => {
  const { method, owner, args } = decodeCall(envelope)
  const now = new Date().toISOString()
  if (method === 'claim_folder') {
    mockDb.folders.set(owner, { owner, name: args[0].str().toString(), templateId: null, claimedAt: now, updatedAt: now })
  } else if (method === 'mint_portfolio') {
    mockDb.chainPortfolios.set(owner, { templateId: args[0].u32(), ipfsCid: args[1].str().toString(), mintedAt: Date.now() })
  } else if (method === 'update_portfolio') {
    const current = mockDb.chainPortfolios.get(owner)
    if (current) mockDb.chainPortfolios.set(owner, { ...current, ipfsCid: args[0].str().toString() })
  }
}

const send = ({ transaction }: { transaction: string }) => {
  const hash = TransactionBuilder.fromXDR(transaction, getNetworkPassphrase()).hash().toString('hex')
  mockDb.transactions.set(hash, transaction)
  applyWrite(transaction)
  return { status: 'PENDING', hash, latestLedger: LEDGER, latestLedgerCloseTime: '0' }
}

const getTransaction = ({ hash }: { hash: string }) => {
  const envelopeXdr = mockDb.transactions.get(hash)
  const base = { latestLedger: LEDGER, latestLedgerCloseTime: '0', oldestLedger: 1, oldestLedgerCloseTime: '0' }
  if (!envelopeXdr) return { ...base, status: 'NOT_FOUND' }
  const result = new xdr.TransactionResult({
    feeCharged: xdr.Int64.fromString('100'),
    result: xdr.TransactionResultResult.txSuccess([]),
    ext: new xdr.TransactionResultExt(0),
  })
  const meta = new xdr.TransactionMeta(
    3,
    new xdr.TransactionMetaV3({ ext: new xdr.ExtensionPoint(0), txChangesBefore: [], operations: [], txChangesAfter: [], sorobanMeta: null }),
  )
  return {
    ...base,
    status: 'SUCCESS',
    ledger: LEDGER,
    createdAt: '0',
    applicationOrder: 1,
    feeBump: false,
    envelopeXdr,
    resultXdr: result.toXDR('base64'),
    resultMetaXdr: meta.toXDR('base64'),
  }
}

const methods: Record<string, (params: never) => unknown> = {
  getLedgerEntries: ({ keys }: { keys: string[] }) => ({ entries: keys.map(accountEntry), latestLedger: LEDGER }),
  simulateTransaction: simulate,
  sendTransaction: send,
  getTransaction,
}

export const rpcHandlers = [
  http.post(env.sorobanRpcUrl, async ({ request }) => {
    const { id, method, params } = (await request.json()) as JsonRpcRequest
    const handler = methods[method]
    if (!handler) return HttpResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unmocked method ${method}` } })
    return HttpResponse.json({ jsonrpc: '2.0', id, result: handler(params as never) })
  }),
]
