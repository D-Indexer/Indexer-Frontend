import { describe, expect, it } from 'vitest'
import { knownTemplateMetadata } from '@/data/knownTemplateMetadata'
import { cidFromIpfsUri, computeRawCidV1, isRawCidV1, isValidContractCid } from './cid'

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
    ['CIDv1 one char too short', `ba${'a'.repeat(43)}`],
    ['CIDv1 one char too long', `ba${'a'.repeat(127)}`],
    ['CIDv1 with uppercase base32', `ba${'A'.repeat(44)}`],
    ['CIDv1 with forbidden base32 char', `ba${'0'.repeat(44)}`],
    ['CIDv0 with forbidden char l', 'QmlwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'],
    ['CIDv0 one char too long', 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdGG'],
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

  it('hashes bytes and strings identically', async () => {
    const text = '{"hello":"folder"}'
    expect(await computeRawCidV1(new TextEncoder().encode(text))).toBe(await computeRawCidV1(text))
  })

  it('produces different CIDs for different content', async () => {
    expect(await computeRawCidV1('a')).not.toBe(await computeRawCidV1('b'))
  })

  it('encodes the raw codec, sha2-256 multihash header', async () => {
    const cid = await computeRawCidV1('')
    // 0x01 0x55 0x12 0x20 → "bafkrei" in base32.
    expect(cid.slice(0, 7)).toBe('bafkrei')
    expect(cid).toHaveLength(59)
  })
})

describe('cidFromIpfsUri', () => {
  it('extracts the CID from ipfs:// URIs', () => {
    expect(cidFromIpfsUri('ipfs://bafkreiabc/templates/1.json')).toBe('bafkreiabc')
    expect(cidFromIpfsUri('https://ipfs.io/ipfs/bafkreiabc')).toBeNull()
  })

  it('stops the CID at a query string or fragment', () => {
    expect(cidFromIpfsUri('ipfs://bafkreiabc?filename=1.json')).toBe('bafkreiabc')
    expect(cidFromIpfsUri('ipfs://bafkreiabc#frag')).toBe('bafkreiabc')
  })

  it('returns null when there is no CID after the scheme', () => {
    expect(cidFromIpfsUri('ipfs://')).toBeNull()
    expect(cidFromIpfsUri('ipfs:///templates/1.json')).toBeNull()
    expect(cidFromIpfsUri('')).toBeNull()
  })
})

describe('isRawCidV1', () => {
  it('only accepts raw CIDv1 prefixes', () => {
    expect(isRawCidV1('bafkreibm6jg3ux5qumhcn2b3flc3tyu6dmlb4xa7u5bf44yegnrjhc4yeq')).toBe(true)
    expect(isRawCidV1('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')).toBe(false)
    expect(isRawCidV1('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')).toBe(false)
  })
})
