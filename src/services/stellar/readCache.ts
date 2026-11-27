/**
 * Ledger-scoped memoization for read-only Soroban contract calls.
 *
 * Entries are keyed by method + args XDR and are only valid while the latest ledger sequence is
 * unchanged, so a read can never be served across a ledger boundary. Concurrent identical reads
 * share one in-flight promise (request coalescing), and writes invalidate the entries of the
 * affected owner immediately.
 */

export interface ReadCacheMetrics {
  hits: number
  misses: number
  coalesced: number
  invalidations: number
  evictions: number
}

export interface ReadCacheOptions {
  /** Latest ledger sequence, or null when it cannot be determined (reads then bypass the cache). */
  getLedger: () => Promise<number | null>
  /** Maximum number of cached entries; the oldest entry is evicted first. */
  maxEntries?: number
}

interface CacheEntry {
  ledger: number
  value: unknown
}

const DEFAULT_MAX_ENTRIES = 100

export const createReadCache = ({ getLedger, maxEntries = DEFAULT_MAX_ENTRIES }: ReadCacheOptions) => {
  const entries = new Map<string, CacheEntry>()
  const inFlight = new Map<string, Promise<unknown>>()
  const metrics: ReadCacheMetrics = { hits: 0, misses: 0, coalesced: 0, invalidations: 0, evictions: 0 }

  const store = (key: string, ledger: number, value: unknown) => {
    entries.delete(key)
    entries.set(key, { ledger, value })
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value
      if (oldest === undefined) break
      entries.delete(oldest)
      metrics.evictions += 1
    }
  }

  return {
    /** Cache key for a contract method call: method + args XDR. */
    key: (method: string, argsXdr: string[]) => `${method}(${argsXdr.join(',')})`,

    /**
     * Returns the cached value for `key` while the latest ledger is unchanged, otherwise runs
     * `load` once and shares its promise with every concurrent caller.
     */
    read: async <T>(key: string, load: () => Promise<T>): Promise<T> => {
      const ledger = await getLedger()
      if (ledger === null) return load()

      const cached = entries.get(key)
      if (cached && cached.ledger === ledger) {
        metrics.hits += 1
        return cached.value as T
      }
      if (cached) entries.delete(key)

      const pending = inFlight.get(key)
      if (pending) {
        metrics.coalesced += 1
        return pending as Promise<T>
      }

      metrics.misses += 1
      const promise = load()
        .then((value) => {
          store(key, ledger, value)
          return value
        })
        .finally(() => {
          inFlight.delete(key)
        })
      inFlight.set(key, promise)
      return promise
    },

    /** Drops every entry whose key matches `predicate` (e.g. all reads of one owner). */
    invalidate: (predicate: (key: string) => boolean) => {
      for (const key of [...entries.keys()]) {
        if (predicate(key)) {
          entries.delete(key)
          metrics.invalidations += 1
        }
      }
    },

    /** Drops everything, e.g. after a write whose affected keys are unknown. */
    clear: () => {
      metrics.invalidations += entries.size
      entries.clear()
    },

    /** Cache hit/miss counters for diagnostics. */
    metrics: () => ({ ...metrics }),

    resetMetrics: () => {
      metrics.hits = 0
      metrics.misses = 0
      metrics.coalesced = 0
      metrics.invalidations = 0
      metrics.evictions = 0
    },

    size: () => entries.size,
  }
}

export type ReadCache = ReturnType<typeof createReadCache>
