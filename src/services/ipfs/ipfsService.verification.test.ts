import { describe, expect, it } from 'vitest'
import { ipfsService } from './ipfsService'

describe('IPFS verification disclosure', () => {
  it('exposes an explicit verification state to callers', () => {
    expect(ipfsService.fetchJsonWithVerification).toBeTypeOf('function')
  })
})
