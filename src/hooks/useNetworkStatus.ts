import { useEffect, useState } from 'react'

export interface NetworkStatus {
  /** False when the browser reports no connection or the Folder backend is unreachable. */
  online: boolean
  /** True when the browser itself reports being offline. */
  browserOffline: boolean
  /** True when the last backend request failed without a response (network error / timeout). */
  backendUnreachable: boolean
}

const readBrowserOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false)

/**
 * Tracks connectivity: browser online/offline events plus backend reachability reported by
 * `apiClient` interceptors. Reconnecting clears the backend-unreachable flag so reads can retry.
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [browserOffline, setBrowserOffline] = useState(() => !readBrowserOnline())
  const [backendUnreachable, setBackendUnreachable] = useState(false)

  useEffect(() => {
    const handleOffline = () => setBrowserOffline(true)
    const handleOnline = () => {
      setBrowserOffline(false)
      setBackendUnreachable(false)
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  useEffect(() => {
    const handleUnreachable = () => setBackendUnreachable(true)
    const handleReachable = () => setBackendUnreachable(false)
    window.addEventListener('indexer:backend-unreachable', handleUnreachable)
    window.addEventListener('indexer:backend-reachable', handleReachable)
    return () => {
      window.removeEventListener('indexer:backend-unreachable', handleUnreachable)
      window.removeEventListener('indexer:backend-reachable', handleReachable)
    }
  }, [])

  return { online: !browserOffline && !backendUnreachable, browserOffline, backendUnreachable }
}
