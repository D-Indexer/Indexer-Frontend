import { folderApi } from '@/services/folders/folderApi'
import { ipfsService } from '@/services/ipfs/ipfsService'
import { portfolioApi } from '@/services/portfolio/portfolioApi'
import { stellarService } from '@/services/stellar/stellarService'
import { templateApi } from '@/services/templates/templateApi'
import type { Folder, Portfolio, PortfolioContent, TemplateWithMetadata } from '@/types'
import type { FolderDataSource } from './types'

export class LiveDataSource implements FolderDataSource {
  readonly isDemo = false

  async listTemplates(): Promise<TemplateWithMetadata[]> {
    const templates = await templateApi.list()
    return Promise.all(
      templates.map(async (template) => ({
        ...template,
        metadata: await ipfsService.resolveTemplateMetadata(template),
      })),
    )
  }

  async getFolderByOwner(address: string): Promise<Folder | null> {
    return folderApi.getByOwner(address)
  }

  async getFolderByName(name: string): Promise<Folder | null> {
    return folderApi.getByName(name)
  }

  async getPortfolio(owner: string): Promise<Portfolio | null> {
    return portfolioApi.getByOwner(owner)
  }

  async getPortfolioContent(cid: string): Promise<PortfolioContent> {
    return ipfsService.fetchJson<PortfolioContent>(cid)
  }

  async verifyPortfolio(owner: string): Promise<[boolean, { ipfsCid: string; templateId: number; mintedAt: number } | null] | null> {
    return Promise.all([
      stellarService.verifyPortfolio(owner),
      stellarService.getOnChainPortfolio(owner),
    ])
  }
}
