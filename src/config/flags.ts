/**
 * Typed feature flags for staged rollout of work-in-progress features.
 *
 * Every flag is declared once in `flagRegistry` with a description, owner and the date it was
 * added (a test fails once a flag is older than `MAX_FLAG_AGE_DAYS`, so flags get removed).
 *
 * Resolution order, later sources win:
 *   1. registry `defaultValue`
 *   2. runtime config: `window.__FOLDER_FLAGS__ = { flagName: true }`, injected by the deployment
 *   3. dev only: `?flags=sponsorship,-trustlessIpfs` query string
 *   4. dev only: localStorage overrides (`setFlagOverride` / `folder:flags`)
 * Production builds ignore 3 and 4.
 */

export interface FlagDefinition {
  /** ISO date the flag was introduced. */
  added: string
  defaultValue: boolean
  description: string
  owner: string
}

export const flagRegistry = {
  sponsorship: {
    added: '2026-11-23',
    defaultValue: false,
    description: 'Sponsored folder claims (fee paid by a sponsor account).',
    owner: 'frontend',
  },
  templateRegistration: {
    added: '2026-11-23',
    defaultValue: false,
    description: 'UI for registering new portfolio templates on the contract.',
    owner: 'frontend',
  },
  trustlessIpfs: {
    added: '2026-11-23',
    defaultValue: false,
    description: 'Upload to IPFS from the browser instead of via Indexer-Backend /upload.',
    owner: 'frontend',
  },
} satisfies Record<string, FlagDefinition>

export type FlagName = keyof typeof flagRegistry
export type FlagValues = Record<FlagName, boolean>
type FlagOverrides = Partial<Record<string, unknown>>

export const MAX_FLAG_AGE_DAYS = 180
export const FLAG_STORAGE_KEY = 'folder:flags'

const isFlagName = (name: string): name is FlagName => Object.prototype.hasOwnProperty.call(flagRegistry, name)

const applyOverrides = (values: FlagValues, overrides: FlagOverrides | null | undefined) => {
  for (const [name, value] of Object.entries(overrides ?? {})) {
    if (isFlagName(name) && typeof value === 'boolean') values[name] = value
  }
}

/** `a,-b` → `{ a: true, b: false }`. */
export const parseFlagQuery = (query: string | null): Record<string, boolean> => {
  const result: Record<string, boolean> = {}
  for (const item of (query ?? '').split(',').map((part) => part.trim()).filter(Boolean)) {
    if (item.startsWith('-')) result[item.slice(1)] = false
    else result[item] = true
  }
  return result
}

export interface FlagSources {
  dev: boolean
  query?: string | null
  runtime?: FlagOverrides | null
  stored?: FlagOverrides | null
}

/** Pure resolver so the precedence rules can be unit-tested. */
export const resolveFlags = ({ dev, query, runtime, stored }: FlagSources): FlagValues => {
  const values = Object.fromEntries(
    Object.entries(flagRegistry).map(([name, definition]) => [name, definition.defaultValue]),
  ) as FlagValues
  applyOverrides(values, runtime)
  if (dev) {
    applyOverrides(values, parseFlagQuery(query ?? null))
    applyOverrides(values, stored)
  }
  return values
}

const readStored = (): FlagOverrides | null => {
  try {
    const raw = globalThis.localStorage?.getItem(FLAG_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FlagOverrides) : null
  } catch {
    return null
  }
}

declare global {
  interface Window {
    __FOLDER_FLAGS__?: FlagOverrides
  }
}

const flags: FlagValues = resolveFlags({
  dev: import.meta.env.DEV,
  query: typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('flags'),
  runtime: typeof window === 'undefined' ? null : window.__FOLDER_FLAGS__,
  stored: import.meta.env.DEV ? readStored() : null,
})

/** Non-React accessor. Values are resolved once at startup. */
export const isFlagEnabled = (name: FlagName): boolean => flags[name]

/** Dev only: persist an override (or clear it with `undefined`); takes effect on reload. */
export const setFlagOverride = (name: FlagName, value: boolean | undefined) => {
  if (!import.meta.env.DEV) return
  const stored = { ...readStored(), [name]: value }
  if (value === undefined) delete stored[name]
  try {
    globalThis.localStorage?.setItem(FLAG_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Storage unavailable (private mode); overrides are a dev convenience only.
  }
}
