import { Badge, Card } from '@/components/ui'
import type { Portfolio } from '@/types'
import { formatDate } from '@/utils/format'
import { getPortfolioStatusLabel, getPortfolioStatusTone } from '@/utils/portfolio'

interface PortfolioStatusCardProps {
  portfolio: Portfolio
}

export const PortfolioStatusCard = ({ portfolio }: PortfolioStatusCardProps) => {
  return (
    <Card>
      <div className="status-list">
        <div className="status-row">
          <span>Status</span>
          <Badge tone={getPortfolioStatusTone(portfolio.status)}>
            {getPortfolioStatusLabel(portfolio.status)}
          </Badge>
        </div>
        <div className="status-row">
          <span>Metadata CID</span>
          <span>{portfolio.metadataCid}</span>
        </div>
        <div className="status-row">
          <span>Created</span>
          <span>{formatDate(portfolio.createdAt)}</span>
        </div>
        <div className="status-row">
          <span>Updated</span>
          <span>{formatDate(portfolio.updatedAt)}</span>
        </div>
      </div>
    </Card>
  )
}
