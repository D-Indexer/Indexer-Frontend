import { Badge, EmptyState, LinkButton } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { sortPortfoliosByUpdatedAt } from '@/domain/portfolio'
import type { Portfolio } from '@/types'
import { formatDate } from '@/utils/format'
import { getPortfolioStatusLabel, getPortfolioStatusTone } from '@/utils/portfolio'

interface PortfolioTableProps {
  portfolios: Portfolio[]
}

export const PortfolioTable = ({ portfolios }: PortfolioTableProps) => {
  if (portfolios.length === 0) {
    return (
      <EmptyState
        title="No portfolios yet"
        description="Create a portfolio to start tracking metadata, verification, and proof-of-work status."
      />
    )
  }

  return (
    <div className="table-shell" role="region" aria-label="Portfolio records" tabIndex={0}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Portfolio</th>
            <th>Template</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Metadata</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {sortPortfoliosByUpdatedAt(portfolios).map((portfolio) => (
            <tr key={portfolio.id}>
              <td>{portfolio.id}</td>
              <td>{portfolio.templateId}</td>
              <td>
                <Badge tone={getPortfolioStatusTone(portfolio.status)}>
                  {getPortfolioStatusLabel(portfolio.status)}
                </Badge>
              </td>
              <td>{formatDate(portfolio.updatedAt)}</td>
              <td className="mono-cell">{portfolio.metadataCid}</td>
              <td>
                <LinkButton to={appRoutes.portfolio(portfolio.id)} variant="secondary">
                  Open
                </LinkButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
