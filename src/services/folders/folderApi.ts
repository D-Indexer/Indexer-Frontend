import { apiClient } from '@/services/http/client'
import { nullIfNotFound } from '@/services/http/errors'
import type { Folder } from '@/types'

export const folderApi = {
  getByOwner: (address: string) => nullIfNotFound(apiClient.get<Folder>(`/folders/${encodeURIComponent(address)}`)),
  getByName: (name: string) => nullIfNotFound(apiClient.get<Folder>(`/folders/name/${encodeURIComponent(name)}`)),
}
