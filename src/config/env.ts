/**
 * Runtime configuration, read from `VITE_*` variables at build time.
 *
 * Every variable is documented in `.env.example` and `docs/configuration.md`.
 * `parseEnv` is pure so it can be unit-tested; `main.tsx` renders a
 * configuration error screen when `envErrors` is non-empty.
 *
 * The dev container (`.devcontainer/`) writes the same values to
 * `public/runtime-config.js` at container start, so the image can be built once
 * and pointed at a different contract/backend without a rebuild. `loadRuntimeConfig`
 * merges that file over the build-time values.
 */

export type StellarNetwork = 'testnet'

export interface AppConfig {
  apiUrl: string
  demoMode: boolean
  /** Sentry-compatible DSN. Empty disables error reporting (and its bundle cost). */
  errorReportingDsn: string
  folderContractId: string
  ipfsGatewayUrl: string
  sorobanRpcUrl: string
  stellarNetwork: StellarNetwork
}

export interface EnvIssue {
  message: string
  variable: string
}

type RawEnv = Record<string, string | boolean | undefined>

const read = (raw: RawEnv, key: string) => {
  const value = raw[key]
  return typeof value === 'string' ? value.trim() : ''
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Soroban contract strkey: `C` followed by 55 base32 characters. */
export const isContractId = (value: string) => /^C[A-Z2-7]{55}$/.test(value)

export const defaults = {
  ipfsGatewayUrl: 'https://ipfs.io/ipfs',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  stellarNetwork: 'testnet',
} as const

export const parseEnv = (raw: RawEnv): { config: AppConfig; errors: EnvIssue[] } => {
  const errors: EnvIssue[] = []
  const demoMode = read(raw, 'VITE_DEMO_MODE') === 'true'

  const apiUrl = trimTrailingSlash(read(raw, 'VITE_API_URL'))
  if (!apiUrl) {
    if (!demoMode) {
      errors.push({ variable: 'VITE_API_URL', message: 'Required. Set it to the Indexer-Backend URL, e.g. http://localhost:3000.' })
    }
  } else if (!isHttpUrl(apiUrl)) {
    errors.push({ variable: 'VITE_API_URL', message: `"${apiUrl}" is not an http(s) URL.` })
  }

  const folderContractId = read(raw, 'VITE_FOLDER_CONTRACT_ID')
  if (!folderContractId) {
    if (!demoMode) {
      errors.push({
        variable: 'VITE_FOLDER_CONTRACT_ID',
        message: 'Required. Use the testnet contract ID from Indexer-Contract deployments/testnet.json.',
      })
    }
  } else if (!isContractId(folderContractId)) {
    errors.push({
      variable: 'VITE_FOLDER_CONTRACT_ID',
      message: 'Must be a Soroban contract ID: "C" followed by 55 uppercase base32 characters.',
    })
  }

  const network = read(raw, 'VITE_STELLAR_NETWORK') || defaults.stellarNetwork
  if (network !== 'testnet') {
    errors.push({
      variable: 'VITE_STELLAR_NETWORK',
      message: `"${network}" is not supported. The Folder contract is only deployed on testnet.`,
    })
  }

  const sorobanRpcUrl = trimTrailingSlash(read(raw, 'VITE_SOROBAN_RPC_URL') || defaults.sorobanRpcUrl)
  if (!isHttpUrl(sorobanRpcUrl)) {
    errors.push({ variable: 'VITE_SOROBAN_RPC_URL', message: `"${sorobanRpcUrl}" is not an http(s) URL.` })
  }

  const ipfsGatewayUrl = trimTrailingSlash(read(raw, 'VITE_IPFS_GATEWAY_URL') || defaults.ipfsGatewayUrl)
  if (!isHttpUrl(ipfsGatewayUrl)) {
    errors.push({ variable: 'VITE_IPFS_GATEWAY_URL', message: `"${ipfsGatewayUrl}" is not an http(s) URL.` })
  }

  const errorReportingDsn = read(raw, 'VITE_ERROR_REPORTING_DSN')
  if (errorReportingDsn && !isHttpUrl(errorReportingDsn)) {
    errors.push({
      variable: 'VITE_ERROR_REPORTING_DSN',
      message: `"${errorReportingDsn}" is not an http(s) URL. Leave it empty to disable error reporting.`,
    })
  }

  return {
    config: {
      apiUrl,
      demoMode,
      errorReportingDsn,
      folderContractId,
      ipfsGatewayUrl,
      sorobanRpcUrl,
      stellarNetwork: 'testnet',
    },
    errors,
  }
}

/** Shape of `public/runtime-config.js` (`window.__FOLDER_CONFIG__`). */
export type RuntimeConfig = Partial<Record<keyof AppConfig, string | boolean>>

declare global {
  interface Window {
    __FOLDER_CONFIG__?: RuntimeConfig
  }
}

const runtimeKeys: Record<keyof AppConfig, string> = {
  apiUrl: 'VITE_API_URL',
  demoMode: 'VITE_DEMO_MODE',
  errorReportingDsn: 'VITE_ERROR_REPORTING_DSN',
  folderContractId: 'VITE_FOLDER_CONTRACT_ID',
  ipfsGatewayUrl: 'VITE_IPFS_GATEWAY_URL',
  sorobanRpcUrl: 'VITE_SOROBAN_RPC_URL',
  stellarNetwork: 'VITE_STELLAR_NETWORK',
}

/**
 * Merges runtime overrides (from `window.__FOLDER_CONFIG__`) over the build-time
 * `VITE_*` values. Runtime values win, so one image can serve any local stack.
 */
export const loadRuntimeConfig = (
  buildEnv: RawEnv,
  runtime: RuntimeConfig | undefined,
): { config: AppConfig; errors: EnvIssue[] } => {
  const merged: RawEnv = { ...buildEnv }
  if (runtime) {
    for (const [key, variable] of Object.entries(runtimeKeys)) {
      const value = runtime[key as keyof AppConfig]
      if (typeof value === 'string' && value.trim()) merged[variable] = value
      else if (typeof value === 'boolean') merged[variable] = String(value)
    }
  }
  return parseEnv(merged)
}

const parsed = loadRuntimeConfig(
  import.meta.env,
  typeof window === 'undefined' ? undefined : window.__FOLDER_CONFIG__,
)

export const env: AppConfig = parsed.config
export const envErrors: EnvIssue[] = parsed.errors
