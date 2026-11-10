import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('starts loading and resolves data', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve(42), []))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(42)
    expect(result.current.error).toBeNull()
  })

  it('exposes errors and recovers on refetch', async () => {
    const callback = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok')
    const { result } = renderHook(() => useAsync(callback, []))

    await waitFor(() => expect(result.current.error?.message).toBe('boom'))
    expect(result.current.data).toBeNull()

    await act(() => result.current.refetch())
    expect(result.current.data).toBe('ok')
    expect(result.current.error).toBeNull()
  })

  it('ignores results from stale requests', async () => {
    let resolveFirst: (value: string) => void = () => undefined
    const first = new Promise<string>((resolve) => {
      resolveFirst = resolve
    })
    const { result, rerender } = renderHook(({ key }) => useAsync(() => (key === 1 ? first : Promise.resolve('second')), [key]), {
      initialProps: { key: 1 },
    })
    rerender({ key: 2 })
    await waitFor(() => expect(result.current.data).toBe('second'))
    await act(async () => resolveFirst('first'))
    expect(result.current.data).toBe('second')
  })
})
