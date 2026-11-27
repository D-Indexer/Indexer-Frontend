/**
 * Immutable content cache in IndexedDB keyed by CID. CIDs are content hashes, so entries never need
 * invalidation; only an LRU size cap evicts. Every operation degrades to a no-op when IndexedDB is
 * unavailable (private mode, tests), so callers never need to guard.
 */
const DB_NAME = 'folder-cid-cache'
const STORE = 'documents'
export const CID_CACHE_MAX_ENTRIES = 200

interface CacheRecord {
  cid: string
  bytes: Uint8Array
  lastAccess: number
}

const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })

const open = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'cid' })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export const createCidCache = (maxEntries = CID_CACHE_MAX_ENTRIES) => ({
  get: async (cid: string): Promise<Uint8Array | null> => {
    try {
      const db = await open()
      if (!db) return null
      const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
      const record = (await request(store.get(cid))) as CacheRecord | undefined
      if (!record) return null
      store.put({ ...record, lastAccess: Date.now() })
      return record.bytes
    } catch {
      return null
    }
  },

  /** Callers must only store bytes whose hash has been verified against the CID. */
  put: async (cid: string, bytes: Uint8Array): Promise<void> => {
    try {
      const db = await open()
      if (!db) return
      const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
      await request(store.put({ cid, bytes, lastAccess: Date.now() } satisfies CacheRecord))
      const all = (await request(store.getAll())) as CacheRecord[]
      const excess = all.length - maxEntries
      if (excess > 0) {
        all
          .sort((a, b) => a.lastAccess - b.lastAccess)
          .slice(0, excess)
          .forEach((record) => store.delete(record.cid))
      }
    } catch {
      /* cache is best-effort */
    }
  },

  clear: async (): Promise<void> => {
    try {
      const db = await open()
      if (db) await request(db.transaction(STORE, 'readwrite').objectStore(STORE).clear())
    } catch {
      /* ignore */
    }
  },
})

export const cidCache = createCidCache()
