import { apiClient } from '@/services/http/client'
import type { Template } from '@/types'

export const templateApi = {
  list: async () => (await apiClient.get<Template[]>('/templates')).data,
}
