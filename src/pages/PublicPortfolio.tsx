import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AsyncContent, Card, ExternalLink } from '@/components/ui'
import {
  DivergenceNotice,
  OwnerToolbar,
  PortfolioView,
  PrintFooter,
  PublicActions,
  usePublicPortfolio,
  VerificationBadge,
} from '@/features/public-portfolio'
import { appRoutes } from '@/config/routes'
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
            <OwnerToolbar owner={portfolio.folder.owner} />
            <PublicActions folderName={folderName} />
            <VerificationBadge owner={portfolio.folder.owner} verification={portfolio.verification} />
            <DivergenceNotice divergence={portfolio.divergence} />
            {portfolio.content ? (
              <>
                <Card>
                  <PortfolioView content={portfolio.content} templateId={portfolio.templateId} />
                </Card>
                {portfolio.cid ? (
                  <PrintFooter
                    checkedAt={new Date()}
                    cid={portfolio.cid}
                    url={`${window.location.origin}${appRoutes.publicPortfolioFor(folderName)}`}
                    verified={portfolio.verification.status === 'verified'}
                  />
                ) : null}
              </>
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
