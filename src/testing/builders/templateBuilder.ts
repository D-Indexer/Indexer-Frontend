import type { Template } from '@/types'

export const buildTemplate = (overrides: Partial<Template> = {}): Template => ({
  id: 'template-test-001',
  name: 'Developer Portfolio',
  creator: 'Folder',
  schema: {},
  price: 10,
  description: 'A portfolio template for technical work.',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})
