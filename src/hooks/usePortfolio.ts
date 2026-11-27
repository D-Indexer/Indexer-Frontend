import { folderData } from '@/services'
import { useDomainEvent } from '@/features/transactions'
import { useAsync } from './useAsync'

/** Portfolio NFT minted by `owner`; `data` is null when none is indexed yet. Re-reads after a confirmed write. */
export const usePortfolio = (owner: string) => {
  const { refetch, ...state } = useAsync(() => folderData.getPortfolio(owner), [owner])
  const refresh = (event: { owner: string }) => {
    if (event.owner === owner) void refetch()
  }
  useDomainEvent('portfolio.minted', refresh)
  useDomainEvent('portfolio.updated', refresh)
  return { ...state, refetch }
}
