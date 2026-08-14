import { StatCard } from '@/components/ui'
import { countPortfoliosByStatus, getVerificationRate } from '@/domain/portfolio'
import type { Portfolio } from '@/types'

interface DashboardMetricsProps {
  portfolios: Portfolio[]
}

export const DashboardMetrics = ({ portfolios }: DashboardMetricsProps) => {
  const statusCounts = countPortfoliosByStatus(portfolios)

  return (
    <div className="grid grid--4">
      <StatCard label="Portfolios" value={portfolios.length.toString()} detail="Records returned by the API" />
      <StatCard label="Verified" value={statusCounts.verified.toString()} detail="Ready for external review" />
      <StatCard
        label="Pending"
        value={statusCounts.credentials_pending.toString()}
        detail="Awaiting credential checks"
      />
      <StatCard label="Verification rate" value={`${getVerificationRate(portfolios)}%`} detail="Verified share" />
    </div>
  )
}
