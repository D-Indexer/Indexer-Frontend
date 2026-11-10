import { env } from '@/config/env'
import { demoFolder, demoPortfolio, demoPortfolioContent, demoTemplates } from '@/data/fixtures'
import { folderApi } from '@/services/folders/folderApi'
import { ipfsService } from '@/services/ipfs/ipfsService'
import { portfolioApi } from '@/services/portfolio/portfolioApi'
import { templateApi } from '@/services/templates/templateApi'
import type { Folder, Portfolio, PortfolioContent, TemplateWithMetadata } from '@/types'

/**
 * The single read path for Folder data. Uses Indexer-Backend + IPFS, or the demo fixtures when
 * (and only when) VITE_DEMO_MODE=true. Errors are never swallowed or replaced with fixtures.
 */
export const folderData = {
  listTemplates: async (): Promise<TemplateWithMetadata[]> => {
    const templates = env.demoMode ? demoTemplates : await templateApi.list()
    return Promise.all(
      templates.map(async (template) => ({ ...template, metadata: await ipfsService.resolveTemplateMetadata(template) })),
    )
  },

  getFolderByOwner: async (address: string): Promise<Folder | null> =>
    env.demoMode ? { ...demoFolder, owner: address } : folderApi.getByOwner(address),

  getFolderByName: async (name: string): Promise<Folder | null> => {
    if (env.demoMode) return name === demoFolder.name ? demoFolder : null
    return folderApi.getByName(name)
  },

  getPortfolio: async (owner: string): Promise<Portfolio | null> =>
    env.demoMode ? { ...demoPortfolio, owner } : portfolioApi.getByOwner(owner),

  getPortfolioContent: async (cid: string): Promise<PortfolioContent> => {
    if (env.demoMode && cid === demoPortfolio.ipfsCid) return demoPortfolioContent
    return ipfsService.fetchJson<PortfolioContent>(cid)
  },
}
