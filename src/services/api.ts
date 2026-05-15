import axios from 'axios'
import type { Portfolio, Template, Credential, ProofOfWork } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Portfolio endpoints
export const portfolioAPI = {
  create: (templateId: string, metadataCid: string) =>
    api.post<Portfolio>('/portfolios', { templateId, metadataCid }),
  get: (id: string) => api.get<Portfolio>(`/portfolios/${id}`),
  update: (id: string, metadataCid: string) =>
    api.patch<Portfolio>(`/portfolios/${id}`, { metadataCid }),
  list: () => api.get<Portfolio[]>('/portfolios'),
  verify: (id: string) => api.post(`/portfolios/${id}/verify`),
}

// Template endpoints
export const templateAPI = {
  register: (name: string, schema: Record<string, unknown>, price: number) =>
    api.post<Template>('/templates', { name, schema, price }),
  list: () => api.get<Template[]>('/templates'),
  get: (id: string) => api.get<Template>(`/templates/${id}`),
  purchase: (id: string) => api.post(`/templates/${id}/purchase`),
}

// Credential endpoints
export const credentialAPI = {
  link: (portfolioId: string, type: string, externalId: string) =>
    api.post<Credential>(`/portfolios/${portfolioId}/credentials`, {
      type,
      externalId,
    }),
  verify: (portfolioId: string, credentialId: string) =>
    api.post(`/portfolios/${portfolioId}/credentials/${credentialId}/verify`),
  list: (portfolioId: string) =>
    api.get<Credential[]>(`/portfolios/${portfolioId}/credentials`),
}

// Proof of work endpoints
export const proofAPI = {
  add: (portfolioId: string, transactionHash: string, amount: number) =>
    api.post<ProofOfWork>(`/portfolios/${portfolioId}/proof`, {
      transactionHash,
      amount,
    }),
  list: (portfolioId: string) =>
    api.get<ProofOfWork[]>(`/portfolios/${portfolioId}/proof`),
}

export default api
