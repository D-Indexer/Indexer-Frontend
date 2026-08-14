import type { Portfolio } from '@/types'

export const mockPortfolios: Portfolio[] = [
  {
    id: 'portfolio-dev-001',
    userId: 'user-demo',
    templateId: 'developer',
    metadataCid: 'bafybeigdyrzt-demo-developer-metadata',
    status: 'verified',
    createdAt: '2026-05-12T10:30:00.000Z',
    updatedAt: '2026-08-01T14:20:00.000Z',
  },
  {
    id: 'portfolio-design-002',
    userId: 'user-demo',
    templateId: 'designer',
    metadataCid: 'bafybeihdsola-demo-designer-metadata',
    status: 'credentials_pending',
    createdAt: '2026-06-04T09:15:00.000Z',
    updatedAt: '2026-07-28T18:45:00.000Z',
  },
  {
    id: 'portfolio-research-003',
    userId: 'user-demo',
    templateId: 'researcher',
    metadataCid: 'bafybeihqvxzn-demo-research-metadata',
    status: 'created',
    createdAt: '2026-07-09T12:00:00.000Z',
    updatedAt: '2026-07-09T12:00:00.000Z',
  },
]
