import { Navigate, useParams } from 'react-router-dom'
import { AsyncContent } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { PageContainer } from '@/layouts'
import { appRoutes } from '@/config/routes'
import { folderData, stellarService } from '@/services'

/** `/a/:address` — resolves the folder owned by a Stellar address and redirects to its canonical page. */
export const PublicByAddressPage = () => {
  const { address = '' } = useParams<{ address: string }>()
  const valid = stellarService.isValidAccountAddress(address)
  const { data, error, loading, refetch } = useAsync(
    () => (valid ? folderData.getFolderByOwner(address) : Promise.resolve(null)),
    [address, valid],
  )

  if (!valid) {
    return (
      <PageContainer>
        <div className="empty-state" role="alert">
          <h1 className="page-title">Invalid address</h1>
          <p>"{address}" is not a valid Stellar account address (it should start with G and be 56 characters).</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AsyncContent
        data={data}
        error={error}
        loading={loading}
        loadingLabel="Looking up folder…"
        minHeight="12rem"
        onRetry={() => void refetch()}
        empty={{ title: 'No folder for this address', description: 'This address has not claimed a folder, or the indexer has not seen it yet.' }}
      >
        {(folder) => <Navigate replace to={appRoutes.publicPortfolioFor(folder.name)} />}
      </AsyncContent>
    </PageContainer>
  )
}
