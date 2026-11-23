import type { Folder, Portfolio, Template } from '@/types'

export interface ChainPortfolio {
  ipfsCid: string
  templateId: number
  mintedAt: number
}

/**
 * In-memory state behind the MSW handlers. Tests seed it per case; `resetMockDb` runs after each
 * test. `rpcErrors` makes the next simulation of a contract method fail with that error text.
 */
export const mockDb = {
  folders: new Map<string, Folder>(),
  portfolios: new Map<string, Portfolio>(),
  templates: [] as Template[],
  ipfs: new Map<string, string>(),
  chainPortfolios: new Map<string, ChainPortfolio>(),
  rpcErrors: new Map<string, string>(),
  /** Submitted transaction envelopes by hash. */
  transactions: new Map<string, string>(),
  backendDown: false,
}

export const resetMockDb = () => {
  mockDb.folders.clear()
  mockDb.portfolios.clear()
  mockDb.templates = []
  mockDb.ipfs.clear()
  mockDb.chainPortfolios.clear()
  mockDb.rpcErrors.clear()
  mockDb.transactions.clear()
  mockDb.backendDown = false
}
