import { AsyncContent, SectionHeader } from '@/components/ui'
import { useFolder, usePortfolio } from '@/hooks'
import type { ApiError } from '@/types'
import { FolderSummary } from './FolderSummary'

interface FolderOverviewProps {
  address: string
}

/** The connected wallet's folder and portfolio, as indexed by the backend. */
export const FolderOverview = ({ address }: FolderOverviewProps) => {
  const folder = useFolder(address)
  const portfolio = usePortfolio(address)
  const error: ApiError | null = folder.error ?? portfolio.error
  const retry = () => {
    void folder.refetch()
    void portfolio.refetch()
  }

  return (
    <section className="stack" aria-labelledby="folder-overview-title">
      <SectionHeader title="Your folder" titleId="folder-overview-title" level={2} />
      <AsyncContent
        data={folder.data}
        error={error}
        loading={folder.loading || portfolio.loading}
        loadingLabel="Loading your folder…"
        onRetry={retry}
        empty={{
          title: 'No folder claimed yet',
          description: 'This address has not claimed a folder name. Newly claimed folders appear once the indexer catches up (usually a few seconds).',
        }}
      >
        {(data) => <FolderSummary folder={data} portfolio={portfolio.data} />}
      </AsyncContent>
    </section>
  )
}
