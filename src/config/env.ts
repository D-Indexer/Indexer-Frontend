/**
 * Runtime configuration, read from `VITE_*` variables at build time.
 *
 * Every variable is documented in `.env.example` and `docs/configuration.md`.
 * `parseEnv` is pure so it can be unit-tested; `main.tsx` renders a
 * configuration error screen when `envErrors` is non-empty.
 */

export type StellarNetwork = 'testnet'

export interface AppConfig {
  apiUrl: string
  demoMode: boolean
  folderContractId: string
  ipfsGatewayUrl: string
  sorobanRpcUrl: string
  /** Ordered Soroban RPC endpoints; the first is preferred, the rest are failover providers. */
  sorobanRpcUrls: string[]
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

  return {
    config: {
      apiUrl,
      demoMode,
      folderContractId,
      ipfsGatewayUrl,
      sorobanRpcUrl,
      sorobanRpcUrls,
      stellarNetwork: 'testnet',
    },
    errors,
  }
}

const parsed = parseEnv(import.meta.env)

export const env: AppConfig = parsed.config
export const envErrors: EnvIssue[] = parsed.errors
