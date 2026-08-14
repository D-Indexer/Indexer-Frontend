import { apiClient } from '@/services/http/client'
import type { ProofOfWork } from '@/types'

export const proofApi = {
  add: (portfolioId: string, transactionHash: string, amount: number) =>
    apiClient.post<ProofOfWork>(`/portfolios/${portfolioId}/proof`, {
      transactionHash,
      amount,
    }),
  list: (portfolioId: string) => apiClient.get<ProofOfWork[]>(`/portfolios/${portfolioId}/proof`),
}
