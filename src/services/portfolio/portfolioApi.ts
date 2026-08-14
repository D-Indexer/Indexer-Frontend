import { apiClient } from '@/services/http/client'
import type { Portfolio } from '@/types'

export const portfolioApi = {
  create: (templateId: string, metadataCid: string) =>
    apiClient.post<Portfolio>('/portfolios', { templateId, metadataCid }),
  get: (id: string) => apiClient.get<Portfolio>(`/portfolios/${id}`),
  update: (id: string, metadataCid: string) =>
    apiClient.patch<Portfolio>(`/portfolios/${id}`, { metadataCid }),
  list: () => apiClient.get<Portfolio[]>('/portfolios'),
  verify: (id: string) => apiClient.post(`/portfolios/${id}/verify`),
}
