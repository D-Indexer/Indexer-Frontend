import { rpc } from '@stellar/stellar-sdk'

/** Minimal surface of `rpc.Server` the pool needs; keeps the pool unit-testable. */
export interface RpcProvider {
  getAccount: (address: string) => Promise<unknown>
  simulateTransaction: (tx: unknown) => Promise<unknown>
  sendTransaction: (tx: unknown) => Promise<unknown>
  getTransaction: (hash: string) => Promise<unknown>
  getLatestLedger: () => Promise<{ sequence: number }>
}

export interface RpcPoolOptions {
  /** A provider is considered unhealthy for this long after a failed call. */
  cooldownMs?: number
  /** A provider whose ledger is more than this many ledgers behind the best one is skipped. */
  maxLedgerLag?: number
  /** How long a health/latency probe is trusted before it is refreshed. */
  probeTtlMs?: number
  now?: () => number
  createServer?: (url: string) => RpcProvider
}

interface ProviderState {
  url: string
  server: RpcProvider
  failures: number
  cooldownUntil: number
  latencyMs: number
  ledger: number
  probedAt: number
}

const defaultCreateServer = (url: string): RpcProvider =>
  new rpc.Server(url, { allowHttp: url.startsWith('http://') }) as unknown as RpcProvider

const isNotFound = (error: unknown) => error instanceof Error && /not found/i.test(error.message)

/**
 * Ordered pool of Soroban RPC providers.
 *
 * - `read` and `poll` fail over across providers (idempotent calls).
 * - `send` uses exactly one provider and never retries, so a transaction cannot be submitted twice.
 */
export const createRpcPool = (urls: string[], options: RpcPoolOptions = {}) => {
  const cooldownMs = options.cooldownMs ?? 30_000
  const maxLedgerLag = options.maxLedgerLag ?? 5
  const probeTtlMs = options.probeTtlMs ?? 15_000
  const now = options.now ?? (() => Date.now())
  const createServer = options.createServer ?? defaultCreateServer

  const unique = [...new Set(urls.map((url) => url.trim()).filter(Boolean))]
  if (unique.length === 0) throw new Error('At least one Soroban RPC URL is required.')
  const providers: ProviderState[] = unique.map((url) => ({
    url,
    server: createServer(url),
    failures: 0,
    cooldownUntil: 0,
    latencyMs: Number.POSITIVE_INFINITY,
    ledger: 0,
    probedAt: 0,
  }))

  const bestLedger = () => providers.reduce((best, provider) => Math.max(best, provider.ledger), 0)

  const isHealthy = (provider: ProviderState) => provider.cooldownUntil <= now()

  const isLagging = (provider: ProviderState) => {
    const best = bestLedger()
    return best > 0 && provider.ledger > 0 && best - provider.ledger > maxLedgerLag
  }

  /** Healthy providers first, then by latency, then by configured order. */
  const ordered = () => {
    const healthy = providers.filter((provider) => isHealthy(provider) && !isLagging(provider))
    const candidates = healthy.length > 0 ? healthy : providers.filter(isHealthy)
    const pool = candidates.length > 0 ? candidates : providers
    return [...pool].sort((a, b) => a.latencyMs - b.latencyMs)
  }

  const markSuccess = (provider: ProviderState, startedAt: number) => {
    provider.failures = 0
    provider.cooldownUntil = 0
    provider.latencyMs = now() - startedAt
  }

  const markFailure = (provider: ProviderState) => {
    provider.failures += 1
    provider.cooldownUntil = now() + cooldownMs * Math.min(provider.failures, 4)
  }

  /** Refreshes latency and ledger height for every provider; failures put a provider in cooldown. */
  const probe = async () => {
    await Promise.all(
      providers.map(async (provider) => {
        if (provider.probedAt > 0 && now() - provider.probedAt < probeTtlMs) return
        const startedAt = now()
        try {
          const { sequence } = await provider.server.getLatestLedger()
          provider.ledger = sequence
          provider.probedAt = now()
          markSuccess(provider, startedAt)
        } catch {
          provider.probedAt = now()
          markFailure(provider)
        }
      }),
    )
  }

  const read = async <T>(call: (server: RpcProvider) => Promise<T>): Promise<T> => {
    await probe()
    let lastError: unknown
    for (const provider of ordered()) {
      const startedAt = now()
      try {
        const result = await call(provider.server)
        markSuccess(provider, startedAt)
        return result
      } catch (error) {
        // "Not found" is a real answer, not a provider outage: do not fail over.
        if (isNotFound(error)) {
          markSuccess(provider, startedAt)
          throw error
        }
        markFailure(provider)
        lastError = error
      }
    }
    throw lastError
  }

  /**
   * Submits to exactly one provider. Never retried on another provider: a retry could submit the
   * same transaction twice. The caller surfaces the error and decides whether to try again.
   */
  const send = async <T>(call: (server: RpcProvider) => Promise<T>): Promise<T> => {
    await probe()
    const [provider] = ordered()
    const startedAt = now()
    try {
      const result = await call(provider.server)
      markSuccess(provider, startedAt)
      return result
    } catch (error) {
      markFailure(provider)
      throw error
    }
  }

  /** Polls `getTransaction` by hash, failing over across providers between attempts. */
  const poll = async <T extends { status: string }>(
    hash: string,
    { attempts = 30, sleepStrategy }: { attempts?: number; sleepStrategy?: { sleep: (attempt: number) => Promise<void> } } = {},
  ): Promise<T> => {
    await probe()
    let lastError: unknown
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const result = await read((server) => server.getTransaction(hash) as Promise<T>)
        if (result.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) return result
      } catch (error) {
        lastError = error
      }
      if (sleepStrategy) await sleepStrategy.sleep(attempt)
    }
    if (lastError) throw lastError
    return (await read((server) => server.getTransaction(hash))) as T
  }

  return { read, send, poll, probe, providers }
}
