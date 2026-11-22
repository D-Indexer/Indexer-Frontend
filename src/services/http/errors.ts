import axios from 'axios'
import type { ApiError } from '@/types'

/** Indexer-Backend error body: `{ "error": "...", "requestId": "..." }`. */
interface BackendErrorBody {
  error?: string
  message?: string
  requestId?: string
}

export const toApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError<BackendErrorBody>(error)) {
    const body = error.response?.data
    if (!error.response) {
      return {
        code: 'FOLDER-API-001',
        docsAnchor: 'folder-api-001',
        message: 'Could not reach the Folder backend. Check that it is running and VITE_API_URL is correct.',
      }
    }
    const is404 = error.response.status === 404
    return {
      code: is404 ? 'FOLDER-API-002' : 'FOLDER-API-003',
      docsAnchor: is404 ? 'folder-api-002' : 'folder-api-003',
      message: body?.error ?? body?.message ?? error.message,
      requestId: body?.requestId,
      status: error.response.status,
    }
  }

  if (error instanceof Error) {
    return { message: error.message }
  }

  return { message: 'Unexpected error' }
}

export const isNotFound = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404

/** Turns a 404 into `null` so "not claimed yet" is an empty state, not an error. */
export const nullIfNotFound = async <T>(request: Promise<{ data: T }>): Promise<T | null> => {
  try {
    return (await request).data
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}
