type StellarNetwork = 'testnet' | 'mainnet'

const getEnv = (key: string, fallback = '') => {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const normalizeNetwork = (network: string): StellarNetwork => {
  return network === 'mainnet' ? 'mainnet' : 'testnet'
}

export const env = {
  apiUrl: trimTrailingSlash(getEnv('VITE_API_URL', 'http://localhost:3001')),
  stellarNetwork: normalizeNetwork(getEnv('VITE_STELLAR_NETWORK', 'testnet')),
  folderContractId: getEnv('VITE_FOLDER_CONTRACT_ID'),
  ipfsApiUrl: trimTrailingSlash(getEnv('VITE_IPFS_API_URL', 'https://ipfs.io')),
  githubApiUrl: trimTrailingSlash(getEnv('VITE_GITHUB_API_URL', 'https://api.github.com')),
  linkedinApiUrl: trimTrailingSlash(getEnv('VITE_LINKEDIN_API_URL', 'https://api.linkedin.com')),
} as const
