import { useAsync } from '@/hooks'
import { loadPublicPortfolio } from './usePublicPortfolio'

export const usePublicPortfolio = (folderName: string) => useAsync(() => loadPublicPortfolio(folderName), [folderName])
