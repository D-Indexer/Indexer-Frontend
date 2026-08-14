import { mockTemplates } from '@/data/mockTemplates'
import { templateApi } from '@/services'
import { useAsync } from './useAsync'

export const useTemplates = () => {
  return useAsync(async () => {
    try {
      const response = await templateApi.list()
      return response.data
    } catch {
      return mockTemplates
    }
  }, [])
}
