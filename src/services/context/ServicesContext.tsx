import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { folderData } from '../data/folderData'
import { freighterWallet } from '../stellar/freighterWallet'
import { ipfsService } from '../ipfs/ipfsService'
import { stellarService } from '../stellar/stellarService'

export interface ServicesRegistry {
  folderData: typeof folderData
  freighterWallet: typeof freighterWallet
  ipfsService: typeof ipfsService
  stellarService: typeof stellarService
}

export const defaultServices: ServicesRegistry = {
  folderData,
  freighterWallet,
  ipfsService,
  stellarService,
}

const ServicesContext = createContext<ServicesRegistry>(defaultServices)

export interface ServicesProviderProps {
  children: ReactNode
  services?: Partial<ServicesRegistry>
}

export const ServicesProvider = ({ children, services }: ServicesProviderProps) => {
  const value = useMemo(() => {
    return {
      ...defaultServices,
      ...services,
    }
  }, [services])

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
}

export const useServices = (): ServicesRegistry => {
  return useContext(ServicesContext)
}
