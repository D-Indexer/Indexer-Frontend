import { useCallback, useEffect, useRef, useState } from 'react'
import { folderData, toApiError } from '@/services'
import type { ApiError, TemplateWithMetadata } from '@/types'

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

/**
 * Like `useAsync`, but appends each item as soon as it resolves so lists render progressively.
 * `data` is null until the first item arrives; `loading` stays true until the stream completes.
 */
export const useProgressiveTemplates = () => {
  const requestIdRef = useRef(0)
  const [state, setState] = useState<AsyncState<TemplateWithMetadata[]>>({
    data: null,
    error: null,
    loading: true,
  })

  const execute = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setState({ data: null, error: null, loading: true })
    try {
      await folderData.streamTemplates((template) => {
        if (requestIdRef.current !== requestId) return
        setState((current) => ({ data: [...(current.data ?? []), template], error: null, loading: true }))
      })
      if (requestIdRef.current === requestId) {
        setState((current) => ({ ...current, loading: false }))
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setState({ data: null, error: toApiError(error), loading: false })
      }
    }
  }, [])

  useEffect(() => {
    void execute()
    return () => {
      requestIdRef.current += 1
    }
  }, [execute])

  return { ...state, refetch: execute }
}
