import { env } from '@/config/env'
import { demoFolder, demoPortfolio, demoPortfolioContent, demoTemplates } from '@/data/fixtures'
import { folderApi } from '@/services/folders/folderApi'
import { ipfsService } from '@/services/ipfs/ipfsService'
import { portfolioApi } from '@/services/portfolio/portfolioApi'
import { templateApi } from '@/services/templates/templateApi'
import type { Folder, Portfolio, PortfolioContent, Template, TemplateWithMetadata } from '@/types'

/** Runs `task` over `items` with at most `limit` promises in flight, preserving input order. */
const mapWithConcurrency = async <T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> => {
  const results = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, worker))
  return results
}

/**
 * The single read path for Folder data. Uses Indexer-Backend + IPFS, or the demo fixtures when
 * (and only when) VITE_DEMO_MODE=true. Errors are never swallowed or replaced with fixtures.
 */
export const folderData = {
  listTemplates: async (): Promise<TemplateWithMetadata[]> => {
    const templates = env.demoMode ? demoTemplates : await templateApi.list()
    return mapWithConcurrency(templates, env.ipfsMaxConcurrency, async (template) => ({
      ...template,
      metadata: await ipfsService.resolveTemplateMetadata(template),
    }))
  },

  /**
   * Lists templates and reports each one as soon as its metadata resolves, so cards can render
   * progressively. `onTemplate` is called once per template, in resolution order.
   */
  streamTemplates: async (onTemplate: (template: TemplateWithMetadata) => void): Promise<void> => {
    const templates: Template[] = env.demoMode ? demoTemplates : await templateApi.list()
    await mapWithConcurrency(templates, env.ipfsMaxConcurrency, async (template) => {
      onTemplate({ ...template, metadata: await ipfsService.resolveTemplateMetadata(template) })
    })
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
