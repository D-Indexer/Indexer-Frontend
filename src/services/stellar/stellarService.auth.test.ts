import { describe, expect, it } from 'vitest'
import { TransactionError } from './stellarService'

describe('prepared transaction authorization validation', () => {
  it('uses a typed error code for unsafe RPC-prepared transactions', () => {
    const error = new TransactionError('unexpected', { code: 'unexpected_auth' })
    expect(error.options.code).toBe('unexpected_auth')
  })
})
