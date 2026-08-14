import { apiClient } from '@/services/http/client'
import type { Template } from '@/types'

export const templateApi = {
  register: (name: string, schema: Record<string, unknown>, price: number) =>
    apiClient.post<Template>('/templates', { name, schema, price }),
  list: () => apiClient.get<Template[]>('/templates'),
  get: (id: string) => apiClient.get<Template>(`/templates/${id}`),
  purchase: (id: string) => apiClient.post(`/templates/${id}/purchase`),
}
