import type { Folder, Portfolio, PortfolioContent, TemplateWithMetadata } from '@/types'

export interface FolderDataSource {
  readonly isDemo: boolean
  listTemplates(): Promise<TemplateWithMetadata[]>
  getFolderByOwner(address: string): Promise<Folder | null>
  getFolderByName(name: string): Promise<Folder | null>
  getPortfolio(owner: string): Promise<Portfolio | null>
  getPortfolioContent(cid: string): Promise<PortfolioContent>
  verifyPortfolio(owner: string): Promise<[boolean, { ipfsCid: string; templateId: number; mintedAt: number } | null] | null>
}
