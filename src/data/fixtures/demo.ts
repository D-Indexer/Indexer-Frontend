/**
 * Demo fixtures, used ONLY when VITE_DEMO_MODE=true. The app shows a persistent "Demo data" banner
 * whenever these are in use. Never import them from code paths that run outside demo mode.
 */
import type { Folder, Portfolio, PortfolioContent, Template } from '@/types'

const DEMO_OWNER = 'GAPAMTTVHB7RZ5DQHEINZN3GQYRCXXWNCQNQSY5YAU6RKQUYX2QJT2CM'

/** Same IDs and metadata URIs as the templates registered on testnet. */
export const demoTemplates: Template[] = [
  { id: 1, metadataUri: 'ipfs://bafkreiejxg6d3gqvi3737mcwxkv4u7gismaraxgv5zfoqtfuc3nbdgve7i', creator: null, registeredAt: '2026-11-09T22:14:42.000Z' },
  { id: 2, metadataUri: 'ipfs://bafkreibl5hwjqwglhrzjepbapjzko74h5zaec5mncnw4u4crn3pejeytgi', creator: null, registeredAt: '2026-11-09T22:14:47.000Z' },
  { id: 3, metadataUri: 'ipfs://bafkreidb373xq4eldginonrutn4hrywugayklcoof2qjxgearzu36b4gg4', creator: null, registeredAt: '2026-11-09T22:14:52.000Z' },
]

export const demoPortfolioContent: PortfolioContent = {
  schema_version: 1,
  folder: 'demo.folder',
  template_id: 1,
  name: 'Ada Demo',
  headline: 'Sample developer portfolio (demo data)',
  bio: 'This portfolio is bundled demo data. Turn off VITE_DEMO_MODE and connect Freighter to publish a real one on testnet.',
  skills: ['TypeScript', 'React', 'Soroban'],
  links: ['https://github.com/D-Indexer'],
  sections: {
    projects: 'Folder frontend: claim a name, pick a template, mint a portfolio NFT.',
    work_history: 'Demo Corp, 2024 to present.',
  },
  updated_at: '2026-11-09T22:23:52.000Z',
}

/** Raw CIDv1 of `serializePortfolioContent(demoPortfolioContent)`; a test keeps them in sync. */
export const DEMO_PORTFOLIO_CID = 'bafkreibf3ro35r3iz4kf6qoewzrqgyadvxzs6vwzpjc5lmjjwx3kuyqho4'

export const demoFolder: Folder = {
  owner: DEMO_OWNER,
  name: 'demo.folder',
  templateId: 1,
  claimedAt: '2026-11-09T22:22:27.000Z',
  updatedAt: '2026-11-09T22:23:07.000Z',
}

export const demoPortfolio: Portfolio = {
  owner: DEMO_OWNER,
  templateId: 1,
  ipfsCid: DEMO_PORTFOLIO_CID,
  mintedAt: '2026-11-09T22:23:07.000Z',
  updatedAt: '2026-11-09T22:23:52.000Z',
}
