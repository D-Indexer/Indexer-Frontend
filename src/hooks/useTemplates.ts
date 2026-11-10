import { folderData } from '@/services'
import { useAsync } from './useAsync'

/** Registered templates with their IPFS metadata. No fallback: failures surface as `error`. */
export const useTemplates = () => useAsync(() => folderData.listTemplates(), [])
