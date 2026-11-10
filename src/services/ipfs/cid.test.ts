import { describe, expect, it } from 'vitest'
import { knownTemplateMetadata } from '@/data/knownTemplateMetadata'
import { cidFromIpfsUri, computeRawCidV1, isValidContractCid } from './cid'

describe('isValidContractCid (mirrors Indexer-Contract validation.rs)', () => {
  it.each([
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    'bafkreibm6jg3ux5qumhcn2b3flc3tyu6dmlb4xa7u5bf44yegnrjhc4yeq',
    'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
  ])('accepts %s', (cid) => {
    expect(isValidContractCid(cid)).toBe(true)
  })

  it.each([
    ['empty', ''],
    ['not a cid', 'bafy_not_a_cid'],
    ['uppercase CIDv1', 'BAFKREIBM6JG3UX5QUMHCN2B3FLC3TYU6DMLB4XA7U5BF44YEGNRJHC4YEQ'],
    ['CIDv0 with forbidden char 0', 'Qm0wAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'],
    ['short CIDv0', 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbd'],
    ['short CIDv1', 'bafkrei'],
    ['too long CIDv1', `ba${'a'.repeat(127)}`],
    ['ipfs URI', 'ipfs://bafkreibm6jg3ux5qumhcn2b3flc3tyu6dmlb4xa7u5bf44yegnrjhc4yeq'],
    ['old demo fixture CID', 'bafybeigdyrzt-demo-developer-metadata'],
  ])('rejects %s', (_label, cid) => {
    expect(isValidContractCid(cid)).toBe(false)
  })
})

describe('computeRawCidV1', () => {
  it('reproduces the template CIDs registered on testnet', async () => {
    for (const [cid, content] of Object.entries(knownTemplateMetadata)) {
      expect(await computeRawCidV1(content)).toBe(cid)
    }
  })

  it('produces contract-valid CIDs', async () => {
    const cid = await computeRawCidV1('{"hello":"folder"}')
    expect(cid.startsWith('bafkrei')).toBe(true)
    expect(isValidContractCid(cid)).toBe(true)
  })
})

describe('cidFromIpfsUri', () => {
  it('extracts the CID from ipfs:// URIs', () => {
    expect(cidFromIpfsUri('ipfs://bafkreiabc/templates/1.json')).toBe('bafkreiabc')
    expect(cidFromIpfsUri('https://ipfs.io/ipfs/bafkreiabc')).toBeNull()
  })
})
