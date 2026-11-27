import { useCallback } from 'react'
import { folderData } from '@/services'
import { useDomainEvent } from '@/features/transactions'
import { useAsync } from './useAsync'

/** Registered templates with their IPFS metadata. No fallback: failures surface as `error`. */
export const useTemplates = () => {
  const { refetch, ...state } = useAsync(() => folderData.listTemplates(), [])
  const refresh = useCallback(() => void refetch(), [refetch])
  useDomainEvent('portfolio.minted', refresh)
  return { ...state, refetch }
}
