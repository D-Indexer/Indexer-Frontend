/**
 * Typed, versioned, namespaced wrapper around `localStorage`.
 *
 * Every key lives under the `folder.` namespace and stores an envelope
 * `{ v: <schema version>, data: <value> }`. Each key declares its own schema
 * version and migrations, so old payloads are upgraded (or dropped) on read.
 * All access is guarded: storage can be unavailable (private mode, quota) and
 * corrupt payloads must never crash the app.
 */

export const STORAGE_NAMESPACE = 'folder.'

export interface StorageKeyDefinition<T> {
  /** Schema version written for new values. */
  version: number
  /** Upgrade a payload from `fromVersion` to `fromVersion + 1`. */
  migrate?: (value: unknown, fromVersion: number) => unknown
  /** Reject payloads that do not match the expected shape. */
  validate: (value: unknown) => value is T
}

interface StorageEnvelope {
  v: number
  data: unknown
}

const isEnvelope = (value: unknown): value is StorageEnvelope =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { v?: unknown }).v === 'number' &&
  'data' in value

const getStore = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

const migrateTo = <T>(definition: StorageKeyDefinition<T>, envelope: StorageEnvelope): unknown => {
  let version = envelope.v
  let value: unknown = envelope.data
  while (version < definition.version) {
    if (!definition.migrate) return undefined
    value = definition.migrate(value, version)
    version += 1
  }
  return version === definition.version ? value : undefined
}

export interface StorageEntry<T> {
  clear: () => void
  /** Full namespaced key, e.g. `folder.wallet.connected`. */
  key: string
  read: () => T | null
  write: (value: T) => void
}

export const createStorageEntry = <T>(name: string, definition: StorageKeyDefinition<T>): StorageEntry<T> => {
  const key = `${STORAGE_NAMESPACE}${name}`

  const read = (): T | null => {
    const store = getStore()
    if (!store) return null
    let raw: string | null
    try {
      raw = store.getItem(key)
    } catch {
      return null
    }
    if (raw === null) return null
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return null
    }
    if (!isEnvelope(parsed)) return null
    const value = migrateTo(definition, parsed)
    return definition.validate(value) ? value : null
  }

  const write = (value: T) => {
    const store = getStore()
    if (!store) return
    try {
      store.setItem(key, JSON.stringify({ v: definition.version, data: value } satisfies StorageEnvelope))
    } catch {
      // Quota or private mode: the app keeps working without persistence.
    }
  }

  const clear = () => {
    const store = getStore()
    if (!store) return
    try {
      store.removeItem(key)
    } catch {
      // Nothing to do if storage is unavailable.
    }
  }

  return { clear, key, read, write }
}

/** Removes every namespaced key. Returns the number of keys removed. */
export const clearNamespacedStorage = (): number => {
  const store = getStore()
  if (!store) return 0
  const keys: string[] = []
  try {
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index)
      if (key && key.startsWith(STORAGE_NAMESPACE)) keys.push(key)
    }
  } catch {
    return 0
  }
  keys.forEach((key) => {
    try {
      store.removeItem(key)
    } catch {
      // Keep clearing the remaining keys.
    }
  })
  return keys.length
}

/** Deletes every IndexedDB database this origin can see. Returns the number removed. */
export const clearIndexedDbCaches = async (): Promise<number> => {
  if (typeof indexedDB === 'undefined') return 0
  const factory = indexedDB as IDBFactory & { databases?: () => Promise<IDBDatabaseInfo[]> }
  if (typeof factory.databases !== 'function') return 0
  let databases: IDBDatabaseInfo[]
  try {
    databases = await factory.databases()
  } catch {
    return 0
  }
  const names = databases
    .map((database) => database.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
  const results = await Promise.all(
    names.map(
      (name) =>
        new Promise<boolean>((resolve) => {
          try {
            const request = indexedDB.deleteDatabase(name)
            request.onsuccess = () => resolve(true)
            request.onerror = () => resolve(false)
            request.onblocked = () => resolve(false)
          } catch {
            resolve(false)
          }
        }),
    ),
  )
  return results.filter(Boolean).length
}

/** Privacy-safe reset: clears namespaced localStorage keys and IndexedDB caches. */
export const clearAllLocalData = async (): Promise<{ indexedDb: number; localStorage: number }> => {
  const localStorageCount = clearNamespacedStorage()
  const indexedDbCount = await clearIndexedDbCaches()
  return { indexedDb: indexedDbCount, localStorage: localStorageCount }
}
