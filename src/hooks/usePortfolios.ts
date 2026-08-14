import { useEffect } from 'react'
import { mockPortfolios } from '@/data/fixtures'
import { portfolioApi } from '@/services'
import { usePortfolioStore } from '@/store'
import { useAsync } from './useAsync'

export const usePortfolios = () => {
  const setPortfolios = usePortfolioStore((state) => state.setPortfolios)

  const state = useAsync(async () => {
    try {
      const response = await portfolioApi.list()
      return response.data
    } catch {
      return mockPortfolios
    }
  }, [])

  useEffect(() => {
    if (state.data) {
      setPortfolios(state.data)
    }
  }, [setPortfolios, state.data])

  return state
}
