import { getDataSource } from './dataSourceFactory'
import type { Folder, Portfolio, PortfolioContent, TemplateWithMetadata } from '@/types'

/**
 * The single read path for Folder data. Delegates to active FolderDataSource
 * (LiveDataSource or DemoDataSource) determined at startup.
 */
export const folderData = {
  listTemplates: async (): Promise<TemplateWithMetadata[]> => getDataSource().listTemplates(),
  getFolderByOwner: async (address: string): Promise<Folder | null> => getDataSource().getFolderByOwner(address),
  getFolderByName: async (name: string): Promise<Folder | null> => getDataSource().getFolderByName(name),
  getPortfolio: async (owner: string): Promise<Portfolio | null> => getDataSource().getPortfolio(owner),
  getPortfolioContent: async (cid: string): Promise<PortfolioContent> => getDataSource().getPortfolioContent(cid),
}
