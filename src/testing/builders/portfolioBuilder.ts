import type { Portfolio } from '@/types'

export const buildPortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  id: 'portfolio-test-001',
  userId: 'user-test-001',
  templateId: 'developer',
  metadataCid: 'bafy-test-metadata-cid',
  status: 'created',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})
