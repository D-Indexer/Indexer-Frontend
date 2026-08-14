import { portfolioStatusLabels } from '@/constants/status'
import type { PortfolioStatus } from '@/types'

export const getPortfolioStatusLabel = (status: PortfolioStatus) => portfolioStatusLabels[status]

export const getPortfolioStatusTone = (status: PortfolioStatus) => {
  if (status === 'verified') return 'success'
  if (status === 'unverified') return 'danger'
  if (status === 'credentials_pending') return 'warning'
  return 'neutral'
}
