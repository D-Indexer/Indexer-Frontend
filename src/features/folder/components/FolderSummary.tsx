import { Card, ExternalLink, LinkButton } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { explorerLinks, ipfsService } from '@/services'
import type { Folder, Portfolio } from '@/types'
import { formatDate } from '@/utils/format'

interface FolderSummaryProps {
  folder: Folder
  portfolio: Portfolio | null
}

export const FolderSummary = ({ folder, portfolio }: FolderSummaryProps) => (
  <Card>
    <dl className="definition-list">
      <div>
        <dt>Folder</dt>
        <dd className="mono">{folder.name}</dd>
      </div>
      <div>
        <dt>Owner</dt>
        <dd className="mono">
          <ExternalLink href={explorerLinks.account(folder.owner)}>{folder.owner}</ExternalLink>
        </dd>
      </div>
      <div>
        <dt>Claimed</dt>
        <dd>{formatDate(folder.claimedAt)}</dd>
      </div>
      {portfolio ? (
        <>
          <div>
            <dt>Template</dt>
            <dd>#{portfolio.templateId}</dd>
          </div>
          <div>
            <dt>Portfolio CID</dt>
            <dd className="mono">
              <ExternalLink href={ipfsService.gatewayUrl(portfolio.ipfsCid)}>{portfolio.ipfsCid}</ExternalLink>
            </dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDate(portfolio.updatedAt)}</dd>
          </div>
        </>
      ) : null}
    </dl>
    {portfolio ? (
      <div className="cluster card__actions">
        <LinkButton to={appRoutes.publicPortfolioFor(folder.name)} variant="secondary">
          View public page
        </LinkButton>
      </div>
    ) : null}
  </Card>
)
