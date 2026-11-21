import axios from 'axios'
import { env } from '@/config/env'

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
})

const notify = (name: 'indexer:backend-unreachable' | 'indexer:backend-reachable') => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(name))
}

// Report backend reachability so `useNetworkStatus` can show the offline banner and retry reads.
apiClient.interceptors.response.use(
  (response) => {
    notify('indexer:backend-reachable')
    return response
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && !error.response) notify('indexer:backend-unreachable')
    else notify('indexer:backend-reachable')
    return Promise.reject(error)
  },
)
