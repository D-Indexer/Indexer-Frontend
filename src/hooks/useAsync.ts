import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError } from '@/services'
import type { ApiError } from '@/types'
import { useNetworkStatus } from './useNetworkStatus'

interface AsyncState<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
}

export const useAsync = <T>(callback: () => Promise<T>, dependencies: React.DependencyList = []) => {
  const requestIdRef = useRef(0)
  const { online } = useNetworkStatus()
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  })

  const execute = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const data = await callback()
      if (requestIdRef.current === requestId) {
        setState({ data, error: null, loading: false })
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setState({ data: null, error: toApiError(error), loading: false })
      }
    }
  }, dependencies)

  useEffect(() => {
    void execute()
    return () => {
      requestIdRef.current += 1
    }
  }, [execute])

  // Deferred retry: when connectivity returns, refetch reads that previously failed.
  const hadErrorRef = useRef(false)
  hadErrorRef.current = state.error !== null
  useEffect(() => {
    if (online && hadErrorRef.current) void execute()
  }, [online, execute])

  return { ...state, refetch: execute }
}
