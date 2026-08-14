import type { Portfolio, PortfolioStatus } from '@/types'

export const portfolioStatusOrder: PortfolioStatus[] = [
  'created',
  'credentials_pending',
  'verified',
  'unverified',
]

export const countPortfoliosByStatus = (portfolios: Portfolio[]) => {
  return portfolioStatusOrder.reduce<Record<PortfolioStatus, number>>(
    (counts, status) => ({
      ...counts,
      [status]: portfolios.filter((portfolio) => portfolio.status === status).length,
    }),
    {
      created: 0,
      credentials_pending: 0,
      verified: 0,
      unverified: 0,
    },
  )
}

export const getVerificationRate = (portfolios: Portfolio[]) => {
  if (portfolios.length === 0) {
    return 0
  }

  const verifiedCount = portfolios.filter((portfolio) => portfolio.status === 'verified').length
  return Math.round((verifiedCount / portfolios.length) * 100)
}

export const sortPortfoliosByUpdatedAt = (portfolios: Portfolio[]) => {
  return [...portfolios].sort((first, second) => {
    return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
  })
}
