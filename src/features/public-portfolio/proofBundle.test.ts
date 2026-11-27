import { describe, expect, it } from 'vitest'
import { computeRawCidV1 } from '@/services/ipfs/cid'
import { OWNER } from '@/testing/fixtures'
import { buildProofBundle, verifyProofBundle } from './proofBundle'

const make = async (text = '{"name":"Jane"}\n') => {
  const contentBytes = new TextEncoder().encode(text)
  const cid = await computeRawCidV1(contentBytes)
  return buildProofBundle({
    contentBytes,
    contract: 'C'.padEnd(56, 'A'),
    cid,
    fetchedAt: new Date('2026-11-25T00:00:00Z'),
    folder: 'jane.folder',
    latestLedger: 100,
    liveUntilLedger: 200,
    onChain: { ipfsCid: cid, templateId: 1, mintedAt: 5 },
    owner: OWNER,
  })
}

describe('verifyProofBundle', () => {
  it('accepts a bundle whose content hashes to the CID, even after a JSON round trip', async () => {
    const bundle = await make()
    expect(bundle.version).toBe(1)
    expect(await verifyProofBundle(JSON.parse(JSON.stringify(bundle)))).toEqual({ valid: true, errors: [] })
  })

  it('rejects tampered content', async () => {
    const bundle = await make()
    const other = await make('{"name":"Mallory"}\n')
    const result = await verifyProofBundle({ ...bundle, contentBase64: other.contentBase64 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('The content does not hash to the CID.')
  })

  it('rejects unknown versions and non-objects', async () => {
    expect((await verifyProofBundle({ ...(await make()), version: 2 })).valid).toBe(false)
    expect((await verifyProofBundle(null)).valid).toBe(false)
  })

  it('rejects a CID that differs from the recorded on-chain response', async () => {
    const bundle = await make()
    const result = await verifyProofBundle({ ...bundle, rpcResponse: { ...bundle.rpcResponse, get_portfolio: { ...bundle.rpcResponse.get_portfolio, ipfsCid: 'bafkreix' } } })
    expect(result.valid).toBe(false)
  })
})
