import { folderData } from '@/services'
import { useDomainEvent } from '@/features/transactions'
import { useAsync } from './useAsync'

/** Folder claimed by `address`; `data` is null when none is indexed yet. Re-reads after a confirmed claim. */
export const useFolder = (address: string) => {
  const { refetch, ...state } = useAsync(() => folderData.getFolderByOwner(address), [address])
  useDomainEvent('folder.claimed', (event) => {
    if (event.owner === address) void refetch()
  })
  return { ...state, refetch }
}
