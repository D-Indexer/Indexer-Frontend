import { useMemo } from 'react'
import { portfolioApi } from '@/services'
import { useAsync } from './useAsync'

export const usePortfolio = (id: string | undefined) => {
  const safeId = id ?? ''
  const state = useAsync(async () => {
    if (!safeId) {
      throw new Error('Portfolio id is required')
    }

    const response = await portfolioApi.get(safeId)
    return response.data
  }, [safeId])

  return useMemo(() => state, [state])
}
