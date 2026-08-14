import type { PortfolioStatus } from '@/types'

export const portfolioStatusLabels: Record<PortfolioStatus, string> = {
  created: 'Created',
  credentials_pending: 'Credentials pending',
  verified: 'Verified',
  unverified: 'Unverified',
}
