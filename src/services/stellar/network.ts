import { env } from '@/config/env'

export const networkPassphrases = {
  mainnet: 'Public Global Stellar Network ; September 2015',
  testnet: 'Test SDF Network ; September 2015',
} as const

export const getNetworkPassphrase = () => networkPassphrases[env.stellarNetwork]
