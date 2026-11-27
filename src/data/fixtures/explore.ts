/** Demo-mode rows for the Explore page (VITE_DEMO_MODE=true only). Owners are placeholders, never queried. */
import type { ExplorePortfolio } from '@/types'
import { DEMO_PORTFOLIO_CID, demoPortfolio } from './demo'

const names = ['demo.folder', 'ada.folder', 'grace.folder', 'linus.folder', 'margaret.folder', 'alan.folder', 'barbara.folder']

export const demoExplorePortfolios: ExplorePortfolio[] = names.map((folderName, index) => ({
  ...demoPortfolio,
  owner: `GDEMOOWNER${String(index).padStart(2, '0')}${'A'.repeat(44)}`,
  ipfsCid: DEMO_PORTFOLIO_CID,
  templateId: (index % 3) + 1,
  updatedAt: new Date(Date.UTC(2026, 10, 9, 22, 23, 52) - index * 3_600_000).toISOString(),
  folderName,
}))
