import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AsyncContent, Card, ExternalLink } from '@/components/ui'
import { PortfolioView, usePublicPortfolio, VerificationBadge } from '@/features/public-portfolio'
import { PageContainer } from '@/layouts'
import { ipfsService } from '@/services'

export const PublicPortfolioPage = () => {
  const { folderName = '' } = useParams<{ folderName: string }>()
  const { data, error, loading, refetch } = usePublicPortfolio(folderName)

  useEffect(() => {
    document.title = data?.content ? `${data.content.name} · ${folderName}` : `${folderName} · Folder`
  }, [data, folderName])

  return (
    <PageContainer>
      <AsyncContent
        data={data}
        error={error}
        loading={loading}
        loadingLabel={`Loading ${folderName}…`}
        minHeight="24rem"
        onRetry={() => void refetch()}
        empty={{ title: 'Folder not found', description: `No one has claimed ${folderName}, or the indexer has not seen it yet.` }}
      >
        {(portfolio) => (
          <div className="public-portfolio">
            <VerificationBadge owner={portfolio.folder.owner} verification={portfolio.verification} />
            {portfolio.content ? (
              <Card>
                <PortfolioView content={portfolio.content} templateId={portfolio.templateId} />
              </Card>
            ) : portfolio.cid ? (
              <div className="notice notice--warning notice--stack" role="status">
                <p>The portfolio content could not be loaded from IPFS: {portfolio.contentError}</p>
                <p>
                  CID: <ExternalLink className="mono" href={ipfsService.gatewayUrl(portfolio.cid)}>{portfolio.cid}</ExternalLink>
                </p>
              </div>
            ) : (
              <div className="empty-state" role="status">
                <h1 className="page-title">{portfolio.folder.name}</h1>
                <p>This folder is claimed, but its owner has not minted a portfolio yet.</p>
              </div>
            )}
          </div>
        )}
      </AsyncContent>
    </PageContainer>
  )
}
