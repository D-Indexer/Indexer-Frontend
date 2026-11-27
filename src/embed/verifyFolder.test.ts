import { describe, expect, it, vi } from 'vitest'
import { computeRawCidV1 } from '@/services/ipfs/cid'
import { OWNER } from '@/testing/fixtures'
import { verifyFolder, type VerifyDeps } from './verifyFolder'

const bytes = new TextEncoder().encode('{"name":"Jane Doe"}\n')

const makeDeps = async (overrides: Partial<VerifyDeps> = {}): Promise<VerifyDeps> => {
  const cid = await computeRawCidV1(bytes)
  return {
    getOwner: vi.fn().mockResolvedValue(OWNER),
    chain: {
      verifyPortfolio: vi.fn().mockResolvedValue(true),
      getOnChainPortfolio: vi.fn().mockResolvedValue({ ipfsCid: cid }),
    },
    fetchContent: vi.fn().mockResolvedValue(bytes),
    ...overrides,
  }
}

describe('verifyFolder', () => {
  it('reports verified when the chain and content hash agree', async () => {
    expect(await verifyFolder('jane.folder', await makeDeps())).toMatchObject({ status: 'verified', displayName: 'Jane Doe', owner: OWNER })
  })

  it('reports not minted for unclaimed folders and missing portfolios', async () => {
    expect((await verifyFolder('x.folder', await makeDeps({ getOwner: vi.fn().mockResolvedValue(null) }))).status).toBe('not_minted')
    const deps = await makeDeps()
    vi.mocked(deps.chain.verifyPortfolio).mockResolvedValue(false)
    expect((await verifyFolder('jane.folder', deps)).status).toBe('not_minted')
  })

  it('reports errors for failures, tampered content and a missing name', async () => {
    const failing = await makeDeps({ getOwner: vi.fn().mockRejectedValue(new Error('boom')) })
    expect(await verifyFolder('jane.folder', failing)).toEqual({ status: 'error', message: 'boom' })
    const tampered = await makeDeps({ fetchContent: vi.fn().mockResolvedValue(new TextEncoder().encode('other')) })
    expect((await verifyFolder('jane.folder', tampered)).status).toBe('error')
    expect((await verifyFolder('', await makeDeps())).status).toBe('error')
  })
})
