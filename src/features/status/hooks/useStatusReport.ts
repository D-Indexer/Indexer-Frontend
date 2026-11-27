import { useCallback, useEffect, useRef, useState } from 'react'
import { toApiError } from '@/services'
import { loadStatusReport, type StatusReport } from '@/services/status/statusService'
import type { ApiError } from '@/types'

interface StatusState {
  data: StatusReport | null
  error: ApiError | null
  loading: boolean
}

/** Loads the dependency status report and refreshes it on an interval. */
export const useStatusReport = (refreshIntervalMs = 30_000) => {
  const requestIdRef = useRef(0)
  const [state, setState] = useState<StatusState>({ data: null, error: null, loading: true })

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setState((current) => ({ ...current, loading: current.data === null, error: null }))
    try {
      const data = await loadStatusReport()
      if (requestIdRef.current === requestId) setState({ data, error: null, loading: false })
    } catch (error) {
      if (requestIdRef.current === requestId) setState({ data: null, error: toApiError(error), loading: false })
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), refreshIntervalMs)
    return () => {
      clearInterval(timer)
      requestIdRef.current += 1
    }
  }, [refresh, refreshIntervalMs])

  return { ...state, refresh }
}
