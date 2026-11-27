import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useContractEvents } from './useContractEvents'

describe('useContractEvents', () => {
  it('does not poll without a connected owner', () => {
    const poll = async () => true
    const { result } = renderHook(() => useContractEvents(null, poll))
    expect(result.current.updated).toBe(false)
  })
})
