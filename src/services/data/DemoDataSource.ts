import { demoFolder, demoPortfolio, demoPortfolioContent, demoTemplates } from '@/data/fixtures'
import { ipfsService } from '@/services/ipfs/ipfsService'
import type { Folder, Portfolio, PortfolioContent, TemplateWithMetadata } from '@/types'
import type { FolderDataSource } from './types'

export class DemoDataSource implements FolderDataSource {
  readonly isDemo = true

  async listTemplates(): Promise<TemplateWithMetadata[]> {
    return Promise.all(
      demoTemplates.map(async (template) => ({
        ...template,
        metadata: await ipfsService.resolveTemplateMetadata(template),
      })),
    )
  }

  async getFolderByOwner(address: string): Promise<Folder | null> {
    return { ...demoFolder, owner: address }
  }

  async getFolderByName(name: string): Promise<Folder | null> {
    return name === demoFolder.name ? demoFolder : null
  }

  async getPortfolio(owner: string): Promise<Portfolio | null> {
    return { ...demoPortfolio, owner }
  }

  async getPortfolioContent(cid: string): Promise<PortfolioContent> {
    if (cid === demoPortfolio.ipfsCid) {
      return demoPortfolioContent
    }
    return demoPortfolioContent
  }

  async verifyPortfolio(_owner: string): Promise<null> {
    return null
  }
}
