import { apiClient } from '@/services/http/client'
import { nullIfNotFound } from '@/services/http/errors'
import type { Portfolio, PortfolioPage } from '@/types'

export const portfolioApi = {
  list: async (cursor: string | null, limit: number) =>
    (await apiClient.get<PortfolioPage>('/portfolios', { params: { limit, ...(cursor ? { cursor } : {}) } })).data,
  getByOwner: (address: string) =>
    nullIfNotFound(apiClient.get<Portfolio>(`/portfolios/${encodeURIComponent(address)}`)),
}
