import { useServices } from '@/services'
import { useAsync } from './useAsync'

/** Portfolio NFT minted by `owner`; `data` is null when none is indexed yet. */
export const usePortfolio = (owner: string) => {
  const { folderData } = useServices()
  return useAsync(() => folderData.getPortfolio(owner), [owner, folderData])
}
