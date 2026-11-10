import type { ReactNode } from 'react'
import type { ApiError } from '@/types'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { ErrorMessage } from './ErrorMessage'
import { LoadingState } from './LoadingState'

interface AsyncContentProps<T> {
  children: (data: T) => ReactNode
  data: T | null
  empty?: { title: string; description: string; action?: ReactNode }
  error: ApiError | null
  /** Treat this value as "nothing to show". Defaults to null or an empty array. */
  isEmpty?: (data: T) => boolean
  loading: boolean
  loadingLabel: string
  /** Reserved height for the loading/error states so the page does not jump when data arrives. */
  minHeight?: string
  onRetry: () => void
}

const defaultIsEmpty = (data: unknown) => Array.isArray(data) && data.length === 0

/** Loading, error (with retry), empty and data states for one async resource. */
export const AsyncContent = <T,>({
  children,
  data,
  empty,
  error,
  isEmpty = defaultIsEmpty,
  loading,
  loadingLabel,
  minHeight = '12rem',
  onRetry,
}: AsyncContentProps<T>) => {
  if (loading) {
    return <LoadingState label={loadingLabel} minHeight={minHeight} />
  }

  if (error) {
    return (
      <div className="async-error" style={{ minHeight }}>
        <ErrorMessage message={error.message} detail={error.requestId ? `Request ID: ${error.requestId}` : undefined} />
        <Button type="button" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }

  if (data === null || isEmpty(data)) {
    return empty ? <EmptyState {...empty} /> : null
  }

  return <>{children(data)}</>
}
