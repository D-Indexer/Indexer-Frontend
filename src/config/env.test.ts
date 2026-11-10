import { describe, expect, it } from 'vitest'
import { isContractId, parseEnv } from './env'

const CONTRACT = 'CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV'

describe('parseEnv', () => {
  it('accepts a complete testnet configuration and applies defaults', () => {
    const { config, errors } = parseEnv({ VITE_API_URL: 'http://localhost:3000/', VITE_FOLDER_CONTRACT_ID: CONTRACT })
    expect(errors).toEqual([])
    expect(config).toEqual({
      apiUrl: 'http://localhost:3000',
      demoMode: false,
      folderContractId: CONTRACT,
      ipfsGatewayUrl: 'https://ipfs.io/ipfs',
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      stellarNetwork: 'testnet',
    })
  })

  it('reports every missing required variable', () => {
    const { errors } = parseEnv({})
    expect(errors.map((issue) => issue.variable)).toEqual(['VITE_API_URL', 'VITE_FOLDER_CONTRACT_ID'])
  })

  it('does not require the backend or contract in demo mode', () => {
    const { config, errors } = parseEnv({ VITE_DEMO_MODE: 'true' })
    expect(errors).toEqual([])
    expect(config.demoMode).toBe(true)
  })

  it('rejects malformed values', () => {
    const { errors } = parseEnv({
      VITE_API_URL: 'localhost:3000',
      VITE_FOLDER_CONTRACT_ID: 'your_contract_id_here',
      VITE_STELLAR_NETWORK: 'mainnet',
      VITE_IPFS_GATEWAY_URL: 'ftp://gateway',
    })
    expect(errors.map((issue) => issue.variable)).toEqual([
      'VITE_API_URL',
      'VITE_FOLDER_CONTRACT_ID',
      'VITE_STELLAR_NETWORK',
      'VITE_IPFS_GATEWAY_URL',
    ])
  })
})

describe('isContractId', () => {
  it('validates the strkey shape', () => {
    expect(isContractId(CONTRACT)).toBe(true)
    expect(isContractId(`G${CONTRACT.slice(1)}`)).toBe(false)
    expect(isContractId(CONTRACT.slice(0, -1))).toBe(false)
  })
})
