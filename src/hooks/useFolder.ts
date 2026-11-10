import { folderData } from '@/services'
import { useAsync } from './useAsync'

/** Folder claimed by `address`; `data` is null when none is indexed yet. */
export const useFolder = (address: string) => useAsync(() => folderData.getFolderByOwner(address), [address])
