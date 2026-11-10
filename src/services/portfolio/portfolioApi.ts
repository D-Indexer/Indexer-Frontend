import { apiClient } from '@/services/http/client'
import { nullIfNotFound } from '@/services/http/errors'
import type { Portfolio } from '@/types'

export const portfolioApi = {
  getByOwner: (address: string) =>
    nullIfNotFound(apiClient.get<Portfolio>(`/portfolios/${encodeURIComponent(address)}`)),
}
