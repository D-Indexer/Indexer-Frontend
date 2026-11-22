import { createContext, useContext } from 'react'
import { env } from '@/config/env'
import { DemoDataSource } from './DemoDataSource'
import { LiveDataSource } from './LiveDataSource'
import type { FolderDataSource } from './types'

let activeDataSource: FolderDataSource | null = null

export const createDataSource = (isDemo: boolean): FolderDataSource => {
  return isDemo ? new DemoDataSource() : new LiveDataSource()
}

export const getDataSource = (): FolderDataSource => {
  if (!activeDataSource) {
    activeDataSource = createDataSource(env.demoMode)
  }
  return activeDataSource
}

export const setDataSource = (source: FolderDataSource | null) => {
  activeDataSource = source
}

export const isDemoMode = (): boolean => getDataSource().isDemo

export const DataSourceContext = createContext<FolderDataSource | null>(null)

export const useDataSource = (): FolderDataSource => {
  const context = useContext(DataSourceContext)
  return context ?? getDataSource()
}
