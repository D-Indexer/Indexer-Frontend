import { useCallback, useEffect, useState } from 'react'
import { toApiError } from '@/services'
import type { ApiError } from '@/types'

interface AsyncState<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
}

export const useAsync = <T>(callback: () => Promise<T>, dependencies: React.DependencyList = []) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  })

  const execute = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const data = await callback()
      setState({ data, error: null, loading: false })
    } catch (error) {
      setState({ data: null, error: toApiError(error), loading: false })
    }
  }, dependencies)

  useEffect(() => {
    void execute()
  }, [execute])

  return { ...state, refetch: execute }
}
