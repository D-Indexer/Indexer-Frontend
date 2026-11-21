import { apiClient } from '@/services/http/client'
import { stellarService } from '@/services/stellar/stellarService'
import { env } from '@/config/env'

export type DependencyStatus = 'healthy' | 'degraded' | 'down'

export interface DependencyCheck {
  /** Human readable name shown in the status table. */
  name: string
  status: DependencyStatus
  /** Round-trip time of the probe in milliseconds, null when the probe never completed. */
  latencyMs: number | null
  /** Short human readable detail (ledger numbers, HTTP status, error message). */
  detail: string
}

export interface IndexerLag {
  /** Latest ledger the indexer has processed, null when unknown. */
  indexedLedger: number | null
  /** Latest ledger the chain reports, null when unknown. */
  chainLedger: number | null
  /** `chainLedger - indexedLedger`, never negative; null when either side is unknown. */
  lagLedgers: number | null
  /** Lag converted to seconds using the chain's ledger close time; null when unknown. */
  lagSeconds: number | null
}

export interface StatusReport {
  checkedAt: string
  dependencies: DependencyCheck[]
  indexerLag: IndexerLag
}

/** Backend health payload; only the fields the status page needs are read. */
interface BackendHealth {
  status?: string
  lastIndexedLedger?: number
  latestLedger?: number
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const elapsed = (start: number) => Math.round(now() - start)

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

const probe = async (name: string, run: () => Promise<{ detail: string; status?: DependencyStatus }>): Promise<DependencyCheck> => {
  const start = now()
  try {
    const result = await run()
    return { name, status: result.status ?? 'healthy', latencyMs: elapsed(start), detail: result.detail }
  } catch (error) {
    return { name, status: 'down', latencyMs: elapsed(start), detail: messageOf(error) }
  }
}

const readLedger = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

/** Computes indexer lag in ledgers and seconds against the chain's latest ledger. */
export const computeIndexerLag = (
  indexedLedger: number | null,
  chainLedger: number | null,
  ledgerCloseTimeSeconds = 5,
): IndexerLag => {
  if (indexedLedger === null || chainLedger === null) {
    return { indexedLedger, chainLedger, lagLedgers: null, lagSeconds: null }
  }
  const lagLedgers = Math.max(0, chainLedger - indexedLedger)
  return { indexedLedger, chainLedger, lagLedgers, lagSeconds: lagLedgers * ledgerCloseTimeSeconds }
}

/** Probes every dependency in parallel; a failing probe never rejects the whole report. */
export const loadStatusReport = async (): Promise<StatusReport> => {
  let chainLedger: number | null = null
  let indexedLedger: number | null = null

  const rpc = await probe('Soroban RPC', async () => {
    const health = await stellarService.getRpcHealth()
    chainLedger = health.latestLedger
    return { detail: `Latest ledger ${health.latestLedger}` }
  })

  const backend = await probe('Indexer backend', async () => {
    const response = await apiClient.get<BackendHealth>('/health')
    const body = response.data ?? {}
    indexedLedger = readLedger(body.lastIndexedLedger)
    chainLedger ??= readLedger(body.latestLedger)
    const degraded = body.status !== undefined && body.status !== 'ok' && body.status !== 'healthy'
    return {
      status: degraded ? 'degraded' : 'healthy',
      detail: indexedLedger !== null ? `Last indexed ledger ${indexedLedger}` : 'Backend reachable',
    }
  })

  const ipfs = await probe('IPFS gateway', async () => {
    const response = await apiClient.get(`${env.ipfsGatewayUrl}/`, { validateStatus: () => true })
    const ok = response.status < 500
    return { status: ok ? 'healthy' : 'degraded', detail: `HTTP ${response.status}` }
  })

  return {
    checkedAt: new Date().toISOString(),
    dependencies: [rpc, backend, ipfs],
    indexerLag: computeIndexerLag(indexedLedger, chainLedger),
  }
}
