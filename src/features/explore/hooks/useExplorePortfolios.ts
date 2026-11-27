import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { folderData, toApiError } from '@/services'
import type { ApiError, ExplorePortfolio } from '@/types'

export const EXPLORE_PAGE_SIZE = 12

/**
 * Cursor-paginated list. The `cursor` query parameter holds the cursor of the most recently loaded page,
 * so reloading or sharing the URL resumes from there. Pages are appended, never infinite-scrolled.
 */
export const useExplorePortfolios = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const startCursor = useRef(searchParams.get('cursor'))
  const requestId = useRef(0)
  const [items, setItems] = useState<ExplorePortfolio[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const nextRef = useRef<string | null>(null)

  const load = useCallback(
    async (cursor: string | null, append: boolean) => {
      const id = ++requestId.current
      setLoading(true)
      setError(null)
      try {
        const page = await folderData.listPortfolios(cursor, EXPLORE_PAGE_SIZE)
        if (id !== requestId.current) return
        setItems((current) => (append ? [...current, ...page.items] : page.items))
        nextRef.current = page.nextCursor
        setNextCursor(page.nextCursor)
        setSearchParams(cursor ? { cursor } : {}, { replace: true })
      } catch (cause) {
        if (id === requestId.current) setError(toApiError(cause))
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [setSearchParams],
  )

  useEffect(() => {
    void load(startCursor.current, false)
    return () => {
      requestId.current += 1
    }
  }, [load])

  const loadMore = () => {
    if (nextRef.current) void load(nextRef.current, true)
  }
  const retry = () => void load(items.length > 0 ? nextRef.current : startCursor.current, items.length > 0)

  return { items, nextCursor, loading, error, loadMore, retry }
}
