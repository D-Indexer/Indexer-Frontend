import { env } from '@/config/env'
import { isTestnetPassphrase } from '@/services/stellar/network'
import { useWalletStore } from '@/store'
import { getServiceEvents } from './eventLog'

/** Values that must never leave the browser in a support bundle. */
const SENSITIVE_KEY = /passphrase|secret|private|seed|mnemonic|token|password|authorization|cookie|api[-_]?key/i
const SENSITIVE_VALUE = /(S[A-Z2-7]{55})|(-----BEGIN [A-Z ]*PRIVATE KEY-----)/

export const REDACTED = '[redacted]'

/** Shortens a Stellar address so support can correlate without receiving the full key. */
export const redactAddress = (address: string | null | undefined) =>
  !address ? null : address.length <= 12 ? REDACTED : `${address.slice(0, 4)}…${address.slice(-4)}`

/** Recursively redacts sensitive keys and secret-looking values. */
export const redact = (value: unknown, key = ''): unknown => {
  if (SENSITIVE_KEY.test(key)) return REDACTED
  if (typeof value === 'string') return SENSITIVE_VALUE.test(value) ? REDACTED : value
  if (Array.isArray(value)) return value.map((item) => redact(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, redact(v, k)]))
  }
  return value
}

export interface DiagnosticsBundle {
  generatedAt: string
  app: { name: string; version: string; mode: string; userAgent: string; url: string }
  config: Record<string, unknown>
  wallet: Record<string, unknown>
  network: Record<string, unknown>
  error: Record<string, unknown> | null
  events: unknown[]
}

export interface DiagnosticsContext {
  /** Where the copy was triggered, e.g. `ErrorMessage` or `ErrorBoundary`. */
  source: string
  error?: { message?: string | null; code?: number | string | null; requestId?: string | null } | null
}

const appVersion = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.1.0'

/** Builds the redacted JSON summary copied by the "Copy diagnostics" action. */
export const buildDiagnostics = (context: DiagnosticsContext): DiagnosticsBundle => {
  const wallet = useWalletStore.getState()
  const bundle: DiagnosticsBundle = {
    generatedAt: new Date().toISOString(),
    app: {
      name: 'Indexer-Frontend',
      version: appVersion,
      mode: import.meta.env.MODE,
      userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
      url: typeof window === 'undefined' ? 'unknown' : window.location.href,
    },
    config: {
      apiUrl: env.apiUrl,
      demoMode: env.demoMode,
      folderContractId: env.folderContractId,
      ipfsGatewayUrl: env.ipfsGatewayUrl,
      sorobanRpcUrl: env.sorobanRpcUrl,
      stellarNetwork: env.stellarNetwork,
    },
    wallet: {
      status: wallet.status,
      address: redactAddress(wallet.address),
      network: wallet.network,
      networkPassphrase: wallet.networkPassphrase ? REDACTED : null,
      error: wallet.error,
    },
    network: {
      stellarNetwork: env.stellarNetwork,
      sorobanRpcUrl: env.sorobanRpcUrl,
      walletNetwork: wallet.network,
      walletOnTestnet: wallet.networkPassphrase ? isTestnetPassphrase(wallet.networkPassphrase) : null,
    },
    error: context.error
      ? {
          source: context.source,
          message: context.error.message ?? null,
          code: context.error.code ?? null,
          requestId: context.error.requestId ?? null,
        }
      : { source: context.source },
    events: getServiceEvents(),
  }

  return redact(bundle) as DiagnosticsBundle
}

export const serializeDiagnostics = (context: DiagnosticsContext) => JSON.stringify(buildDiagnostics(context), null, 2)
