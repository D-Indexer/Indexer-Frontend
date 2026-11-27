/**
 * Runtime configuration, loaded from `/config.json` at boot or from `VITE_*` variables at build time.
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

declare const __BUILD_COMMIT__: string

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
  /** Ordered Soroban RPC endpoints; the first is preferred, the rest are failover providers. */
  sorobanRpcUrls: string[]
  stellarNetwork: StellarNetwork
  sponsorEnabled: boolean
}

export interface EnvIssue {
  message: string
  variable: string
}

export type RawEnv = Record<string, string | boolean | undefined>

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

/**
 * Single source of truth for configuration. `parseEnv` iterates this list and
 * `scripts/gen-env-docs.mjs` generates `.env.example` and `docs/configuration.md`
 * from it, so the docs cannot drift from the parser.
 */
export interface EnvVarSchema {
  /** `VITE_*` variable name. */
  name: string
  /** Key on `AppConfig` the parsed value is assigned to. */
  key: keyof AppConfig
  /** One-line purpose, used in the docs table and `.env.example`. */
  description: string
  /** Value used when the variable is unset or empty. */
  default?: string
  /** Value written to `.env.example`. */
  example: string
  /** Human-readable validation rule, used in the docs table. */
  validation: string
  /** Required unless demo mode is enabled. */
  requiredUnlessDemo?: boolean
  /** Parses and validates a raw value; returns the config value and any issue. */
  parse: (value: string) => { value: unknown; error?: string }
}

  const network = read(raw, 'VITE_STELLAR_NETWORK') || defaults.stellarNetwork
  const sponsorEnabled = read(raw, 'VITE_SPONSOR_ENABLED') === 'true'
  if (network !== 'testnet') {
    errors.push({
      variable: 'VITE_STELLAR_NETWORK',
      message: `"${network}" is not supported. The Folder contract is only deployed on testnet.`,
    })
  }

export const envSchema: EnvVarSchema[] = [
  {
    name: 'VITE_API_URL',
    key: 'apiUrl',
    description: 'Indexer-Backend base URL (`/folders`, `/portfolios`, `/templates`, `/upload`).',
    example: 'http://localhost:3000',
    validation: 'http(s) URL',
    requiredUnlessDemo: true,
    parse: (value) => {
      if (!value) {
        return {
          value: '',
          error: 'Required. Set it to the Indexer-Backend URL, e.g. http://localhost:3000.',
        }
      }
      return parseHttpUrl(value)
    },
  },
  {
    name: 'VITE_FOLDER_CONTRACT_ID',
    key: 'folderContractId',
    description:
      'Folder contract that transactions are built against. Testnet: `CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV`.',
    example: 'CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV',
    validation: '`C` + 55 base32 chars',
    requiredUnlessDemo: true,
    parse: (value) => {
      if (!value) {
        return {
          value: '',
          error: 'Required. Use the testnet contract ID from Indexer-Contract deployments/testnet.json.',
        }
      }
      return isContractId(value)
        ? { value }
        : {
            value,
            error: 'Must be a Soroban contract ID: "C" followed by 55 uppercase base32 characters.',
          }
    },
  },
  {
    name: 'VITE_STELLAR_NETWORK',
    key: 'stellarNetwork',
    description:
      'Network the app expects the wallet to be on. The contract is not deployed on mainnet.',
    default: defaults.stellarNetwork,
    example: defaults.stellarNetwork,
    validation: 'must be `testnet`',
    parse: (value) => {
      const network = value || defaults.stellarNetwork
      return network === 'testnet'
        ? { value: network }
        : {
            value: network,
            error: `"${network}" is not supported. The Folder contract is only deployed on testnet.`,
          }
    },
  },
  {
    name: 'VITE_SOROBAN_RPC_URL',
    key: 'sorobanRpcUrl',
    description:
      'Soroban RPC used to simulate, submit and poll transactions and to call `verify_portfolio`.',
    default: defaults.sorobanRpcUrl,
    example: defaults.sorobanRpcUrl,
    validation: 'http(s) URL',
    parse: (value) => parseHttpUrl(value || defaults.sorobanRpcUrl),
  },
  {
    name: 'VITE_IPFS_GATEWAY_URL',
    key: 'ipfsGatewayUrl',
    description:
      "Gateway used to read portfolio and template JSON (`<gateway>/<cid>`). Use `http://localhost:8080/ipfs` with the backend's local Kubo node.",
    default: defaults.ipfsGatewayUrl,
    example: defaults.ipfsGatewayUrl,
    validation: 'http(s) URL',
    parse: (value) => parseHttpUrl(value || defaults.ipfsGatewayUrl),
  },
  {
    name: 'VITE_DEMO_MODE',
    key: 'demoMode',
    description:
      'Serves bundled fixtures, shows a persistent "Demo data" banner and disables wallet transactions.',
    default: 'false',
    example: 'false',
    validation: '`true` enables it',
    parse: (value) => ({ value: value === 'true' }),
  },
]
/** `AppConfig` key → `VITE_*` variable name, derived from `envSchema`. */
export const envVarNames = Object.fromEntries(
  envSchema.map((variable) => [variable.key, variable.name]),
) as Record<keyof AppConfig, string>

  // `VITE_SOROBAN_RPC_URLS` is a comma-separated, ordered list. The single-URL variable stays
  // supported: it is used when the list is empty, and appended as a last-resort provider otherwise.
  const sorobanRpcUrls: string[] = []
  const rawList = read(raw, 'VITE_SOROBAN_RPC_URLS')
  for (const entry of rawList.split(',')) {
    const url = trimTrailingSlash(entry.trim())
    if (!url) continue
    if (!isHttpUrl(url)) {
      errors.push({ variable: 'VITE_SOROBAN_RPC_URLS', message: `"${url}" is not an http(s) URL.` })
    } else if (!sorobanRpcUrls.includes(url)) {
      sorobanRpcUrls.push(url)
    }
  }
  if (sorobanRpcUrls.length === 0) {
    sorobanRpcUrls.push(sorobanRpcUrl)
  } else if (isHttpUrl(sorobanRpcUrl) && !sorobanRpcUrls.includes(sorobanRpcUrl)) {
    sorobanRpcUrls.push(sorobanRpcUrl)
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
      sorobanRpcUrls,
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

/** Commit the bundle was built from, injected by `vite.config.ts` (issue #243). */
export const buildCommit: string = typeof __BUILD_COMMIT__ === 'string' ? __BUILD_COMMIT__ : 'unknown'

export const env: AppConfig = parsed.config
export const envErrors: EnvIssue[] = parsed.errors
export const resourceHints: ResourceHint[] = resourceHintsFor(env)
