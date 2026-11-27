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
  rumEndpoint: string
  rumSampleRate: number
  sorobanRpcUrl: string
  stellarNetwork: StellarNetwork
  sponsorEnabled: boolean
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
  rumSampleRate: 1,
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
  const sponsorEnabled = read(raw, 'VITE_SPONSOR_ENABLED') === 'true'
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
  const folderContractWasmHash = read(raw, 'VITE_FOLDER_CONTRACT_WASM_HASH').toLowerCase()
  if (folderContractWasmHash && !/^[0-9a-f]{64}$/.test(folderContractWasmHash)) {
    errors.push({ variable: 'VITE_FOLDER_CONTRACT_WASM_HASH', message: 'Must be a 32-byte WASM hash encoded as 64 lowercase hexadecimal characters.' })
  }

  // Real-user monitoring is opt-in: unset (or invalid) means no collection at all.
  const rumEndpoint = read(raw, 'VITE_RUM_ENDPOINT')
  if (rumEndpoint && !isHttpUrl(rumEndpoint)) {
    errors.push({ variable: 'VITE_RUM_ENDPOINT', message: `"${rumEndpoint}" is not an http(s) URL.` })
  }

  const rawSampleRate = read(raw, 'VITE_RUM_SAMPLE_RATE')
  let rumSampleRate = defaults.rumSampleRate
  if (rawSampleRate) {
    const parsedRate = Number(rawSampleRate)
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 1) {
      errors.push({
        variable: 'VITE_RUM_SAMPLE_RATE',
        message: `"${rawSampleRate}" must be a number between 0 and 1.`,
      })
    } else {
      rumSampleRate = parsedRate
    }
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
      rumEndpoint,
      rumSampleRate,
      sorobanRpcUrl,
      stellarNetwork: 'testnet',
      sponsorEnabled,
    },
    errors,
  }
}

export interface ResourceHint {
  href: string
  rel: 'preconnect' | 'dns-prefetch'
}

/**
 * Origins the app talks to at runtime, derived from config so the browser can open
 * connections before the first request. `main.tsx` injects them into `<head>`.
 */
export const resourceHintsFor = (config: AppConfig): ResourceHint[] => {
  const origins = [config.sorobanRpcUrl, config.apiUrl, config.ipfsGatewayUrl]
    .filter((value) => value !== '')
    .map((value) => {
      try {
        return new URL(value).origin
      } catch {
        return ''
      }
    })
    .filter((origin, index, all) => origin !== '' && all.indexOf(origin) === index)

  return origins.flatMap((origin) => [
    { href: origin, rel: 'preconnect' as const },
    { href: origin, rel: 'dns-prefetch' as const },
  ])
}

const parsed = parseEnv(import.meta.env)

export const env: AppConfig = parsed.config
export const envErrors: EnvIssue[] = parsed.errors
export const resourceHints: ResourceHint[] = resourceHintsFor(env)
