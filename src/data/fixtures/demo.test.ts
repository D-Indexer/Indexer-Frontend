import { describe, expect, it } from 'vitest'
import { computeRawCidV1, isValidContractCid } from '@/services/ipfs/cid'
import { serializePortfolioContent } from '@/services/ipfs/ipfsService'
import { DEMO_PORTFOLIO_CID, demoPortfolioContent } from './demo'

describe('demo fixtures', () => {
  it('use a real, contract-valid CID for the demo portfolio content', async () => {
    expect(isValidContractCid(DEMO_PORTFOLIO_CID)).toBe(true)
    expect(await computeRawCidV1(serializePortfolioContent(demoPortfolioContent))).toBe(DEMO_PORTFOLIO_CID)
  })
})
