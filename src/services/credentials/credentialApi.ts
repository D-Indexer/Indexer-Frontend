import { apiClient } from '@/services/http/client'
import type { Credential } from '@/types'

export const credentialApi = {
  link: (portfolioId: string, type: string, externalId: string) =>
    apiClient.post<Credential>(`/portfolios/${portfolioId}/credentials`, {
      type,
      externalId,
    }),
  verify: (portfolioId: string, credentialId: string) =>
    apiClient.post(`/portfolios/${portfolioId}/credentials/${credentialId}/verify`),
  list: (portfolioId: string) =>
    apiClient.get<Credential[]>(`/portfolios/${portfolioId}/credentials`),
}
