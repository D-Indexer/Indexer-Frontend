import { folderData } from '@/services'
import { useAsync, useProgressiveTemplates } from './useAsync'

/** Registered templates with their IPFS metadata. No fallback: failures surface as `error`. */
export const useTemplates = () => useAsync(() => folderData.listTemplates(), [])

/** Same as `useTemplates`, but appends each template as soon as its metadata resolves. */
export const useProgressiveTemplateList = () => useProgressiveTemplates()
