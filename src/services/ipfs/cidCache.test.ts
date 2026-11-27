import { describe, expect, it } from 'vitest'
import { createCidCache } from './cidCache'

describe('cidCache without IndexedDB', () => {
  it('degrades to a no-op', async () => {
    const cache = createCidCache()
    await expect(cache.put('bafkreiabc', new Uint8Array([1]))).resolves.toBeUndefined()
    await expect(cache.get('bafkreiabc')).resolves.toBeNull()
  })
})
