import { describe, expect, it } from 'vitest'
import { NoneExplorer, StellarChainExplorer, StellarExpertExplorer } from './explorers'

describe('ExplorerProvider abstraction', () => {
  const address = 'GBJ7ABC123'
  const contractId = 'CDDQK74SMH'
  const hash = 'a1b2c3d4'

  it('generates expected URLs with StellarExpertExplorer', () => {
    const explorer = new StellarExpertExplorer()
    expect(explorer.account(address, 'testnet')).toBe(`https://stellar.expert/explorer/testnet/account/${address}`)
    expect(explorer.contract(contractId, 'testnet')).toBe(`https://stellar.expert/explorer/testnet/contract/${contractId}`)
    expect(explorer.transaction(hash, 'testnet')).toBe(`https://stellar.expert/explorer/testnet/tx/${hash}`)
  })

  it('generates expected URLs with StellarChainExplorer', () => {
    const explorer = new StellarChainExplorer()
    expect(explorer.account(address, 'testnet')).toBe(`https://testnet.stellarchain.io/address/${address}`)
    expect(explorer.contract(contractId, 'testnet')).toBe(`https://testnet.stellarchain.io/contract/${contractId}`)
    expect(explorer.transaction(hash, 'testnet')).toBe(`https://testnet.stellarchain.io/tx/${hash}`)
  })

  it('returns null with NoneExplorer for standalone networks', () => {
    const explorer = new NoneExplorer()
    expect(explorer.account(address)).toBeNull()
    expect(explorer.contract(contractId)).toBeNull()
    expect(explorer.transaction(hash)).toBeNull()
  })
})
