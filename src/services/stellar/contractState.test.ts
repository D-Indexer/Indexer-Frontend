import { describe, expect, it } from 'vitest'
import { decodeFolderEvent } from './contractState'

describe('Folder event decoder', () => {
  it('decodes only complete typed portfolio events', () => {
    expect(decodeFolderEvent('port_mint', { ipfsCid: 'bafk', templateId: 3 })).toEqual({ type: 'portfolio_minted', ipfsCid: 'bafk', templateId: 3 })
    expect(decodeFolderEvent('port_mint', { ipfsCid: 'bafk' })).toBeNull()
  })
})
