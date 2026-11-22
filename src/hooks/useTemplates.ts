import { useServices } from '@/services'
import { useAsync } from './useAsync'

/** Registered templates with their IPFS metadata. No fallback: failures surface as `error`. */
export const useTemplates = () => {
  const { folderData } = useServices()
  return useAsync(() => folderData.listTemplates(), [folderData])
}
