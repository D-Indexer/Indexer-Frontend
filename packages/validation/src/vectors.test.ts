import { describe, expect, it } from 'vitest'
import vectors from '../vectors/contract-vectors.json'
import { isValidContractCid, validateFolderName } from '.'

// Contract-generated vectors: the TS rules must agree with Indexer-Contract on every input.
describe('contract test vectors', () => {
  it.each(vectors.folderName.map((v) => [v.input, v.valid] as const))('folder name %j valid=%s', (input, valid) => {
    expect(validateFolderName(input) === null).toBe(valid)
  })

  it.each(vectors.cid.map((v) => [v.input, v.valid] as const))('cid %j valid=%s', (input, valid) => {
    expect(isValidContractCid(input)).toBe(valid)
  })
})
