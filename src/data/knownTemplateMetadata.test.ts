import { describe, expect, it } from 'vitest'
import { computeRawCidV1 } from '@folder/validation'
import { knownTemplateMetadata } from './knownTemplateMetadata'

describe('knownTemplateMetadata', () => {
  it('reproduces the template CIDs registered on testnet', async () => {
    for (const [cid, content] of Object.entries(knownTemplateMetadata)) {
      expect(await computeRawCidV1(content)).toBe(cid)
    }
  })
})
