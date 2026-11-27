import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stellarService } from '@/services/stellar/stellarService'
import { useContractTx } from './useContractTx'

describe('useContractTx Web Locks API concurrency guarding', () => {
  const owner = 'GBJ7...OWNER'
  const mockWrite = { method: 'claim_folder' as const, folderName: 'alice.folder' }

  beforeEach(() => {
    vi.spyOn(stellarService, 'invoke').mockResolvedValue({ hash: 'txhash123', ledger: 100 })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (navigator as unknown as { locks?: unknown }).locks
  })

  it('runs transaction when Web Lock is available', async () => {
    const requestMock = vi.fn().mockImplementation(async (_name, _opts, callback) => {
      return callback({ name: 'folder-write:' + owner })
    })

    Object.defineProperty(navigator, 'locks', {
      value: { request: requestMock },
      configurable: true,
    })

    const { result } = renderHook(() => useContractTx())

    let res
    await act(async () => {
      res = await result.current.run(owner, async () => mockWrite)
    })

    expect(requestMock).toHaveBeenCalledWith('folder-write:' + owner, { ifAvailable: true }, expect.any(Function))
    expect(res).toEqual({ hash: 'txhash123', ledger: 100 })
    expect(result.current.stage).toBe('done')
  })

  it('rejects with descriptive message when Web Lock is unavailable', async () => {
    const requestMock = vi.fn().mockImplementation(async (_name, _opts, callback) => {
      // Pass null to indicate lock is already held by another tab
      return callback(null)
    })

    Object.defineProperty(navigator, 'locks', {
      value: { request: requestMock },
      configurable: true,
    })

    const { result } = renderHook(() => useContractTx())

    let res
    await act(async () => {
      res = await result.current.run(owner, async () => mockWrite)
    })

    expect(res).toBeNull()
    expect(result.current.stage).toBe('failed')
    expect(result.current.error).toBe('Another tab is already sending a transaction. Please wait for it to finish.')
  })

  it('gracefully degrades when navigator.locks is unsupported', async () => {
    Object.defineProperty(navigator, 'locks', {
      value: undefined,
      configurable: true,
    })

    const { result } = renderHook(() => useContractTx())

    let res
    await act(async () => {
      res = await result.current.run(owner, async () => mockWrite)
    })

    expect(res).toEqual({ hash: 'txhash123', ledger: 100 })
    expect(result.current.stage).toBe('done')
  })
})
