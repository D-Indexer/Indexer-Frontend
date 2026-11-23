import { setupWorker } from 'msw/browser'
import { demoFolder, demoPortfolio, demoPortfolioContent, demoTemplates } from '@/data/fixtures'
import { computeRawCidV1 } from '@/services/ipfs/cid'
import { serializePortfolioContent } from '@/services/ipfs/ipfsService'
import { mockDb } from './db'
import { handlers } from './handlers'

/** `npm run dev:mock`: serves the test handlers from a service worker, seeded with the demo fixtures. */
export const startMockWorker = async () => {
  const content = serializePortfolioContent(demoPortfolioContent)
  const cid = await computeRawCidV1(content)
  mockDb.templates = demoTemplates
  mockDb.folders.set(demoFolder.owner, demoFolder)
  mockDb.portfolios.set(demoFolder.owner, { ...demoPortfolio, ipfsCid: cid })
  mockDb.ipfs.set(cid, content)
  mockDb.chainPortfolios.set(demoFolder.owner, { ipfsCid: cid, templateId: demoPortfolio.templateId, mintedAt: 0 })
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass' })
}
