/**
 * Runtime configuration, read from `VITE_*` variables at build time.
 *
 * Every variable is documented in `.env.example` and `docs/configuration.md`.
 * `parseEnv` is pure so it can be unit-tested; `main.tsx` renders a
 * configuration error screen when `envErrors` is non-empty.
 *
 * `envSchema` is the single source of truth: `parseEnv` iterates it and
 * `scripts/gen-env-docs.mjs` generates `.env.example` and `docs/configuration.md`
 * from it (`npm run docs:env`). CI fails when the generated files drift.
 */

export type StellarNetwork = 'testnet'

export interface AppConfig {
  apiUrl: string
  demoMode: boolean
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

const parseHttpUrl = (value: string) => {
  const url = trimTrailingSlash(value)
  return isHttpUrl(url) ? { value: url } : { value: url, error: `"${url}" is not an http(s) URL.` }
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

export const parseEnv = (raw: RawEnv): { config: AppConfig; errors: EnvIssue[] } => {
  const errors: EnvIssue[] = []
  const demoMode = read(raw, envVarNames.demoMode) === 'true'
  const config: Record<string, unknown> = {}

  for (const variable of envSchema) {
    const { value, error } = variable.parse(read(raw, variable.name))
    config[variable.key] = value
    if (error && !(variable.requiredUnlessDemo && demoMode)) {
      errors.push({ variable: variable.name, message: error })
    }
  }

  return { config: config as unknown as AppConfig, errors }
}

const parsed = parseEnv(import.meta.env)

export const env: AppConfig = parsed.config
export const envErrors: EnvIssue[] = parsed.errors
