import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFolder, buildPortfolio, CID_V1, CID_V2 } from '@/testing/fixtures'

const data = vi.hoisted(() => ({ getFolderByName: vi.fn(), getPortfolio: vi.fn(), getPortfolioContent: vi.fn() }))
const chain = vi.hoisted(() => ({ verifyPortfolio: vi.fn(), getOnChainPortfolio: vi.fn() }))
vi.mock('@/services/data/folderData', () => ({ folderData: data }))
vi.mock('@/services/stellar/stellarService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/stellar/stellarService')>()
  return { ...original, stellarService: { ...original.stellarService, ...chain } }
})

const { loadPublicPortfolio } = await import('./usePublicPortfolio')

describe('loadPublicPortfolio divergence', () => {
  beforeEach(() => {
    Object.values({ ...data, ...chain }).forEach((fn) => fn.mockReset())
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    data.getFolderByName.mockResolvedValue(buildFolder({ templateId: 3 }))
    data.getPortfolio.mockResolvedValue(buildPortfolio({ templateId: 3, ipfsCid: CID_V1 }))
    data.getPortfolioContent.mockResolvedValue(null)
    chain.verifyPortfolio.mockResolvedValue(true)
  })

  it('reports no divergence when indexer and chain agree', async () => {
    chain.getOnChainPortfolio.mockResolvedValue({ ipfsCid: CID_V1, templateId: 3, mintedAt: 0 })
    const result = await loadPublicPortfolio('jane.folder')
    expect(result?.divergence).toEqual([])
  })

  it('reports CID divergence and renders the on-chain CID', async () => {
    chain.getOnChainPortfolio.mockResolvedValue({ ipfsCid: CID_V2, templateId: 3, mintedAt: 0 })
    const result = await loadPublicPortfolio('jane.folder')
    expect(result?.divergence).toEqual([{ field: 'ipfsCid', indexed: CID_V1, onChain: CID_V2 }])
    expect(result?.cid).toBe(CID_V2)
    expect(console.warn).toHaveBeenCalled()
  })

  it('reports template divergence and renders the on-chain template', async () => {
    chain.getOnChainPortfolio.mockResolvedValue({ ipfsCid: CID_V1, templateId: 5, mintedAt: 0 })
    const result = await loadPublicPortfolio('jane.folder')
    expect(result?.divergence).toEqual([{ field: 'templateId', indexed: 3, onChain: 5 }])
    expect(result?.templateId).toBe(5)
  })
})
