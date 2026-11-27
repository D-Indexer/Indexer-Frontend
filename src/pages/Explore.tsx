import { Button, EmptyState, ErrorMessage, LoadingState, SectionHeader } from '@/components/ui'
import { ExploreCard, useExplorePortfolios } from '@/features/explore'
import { PageContainer } from '@/layouts'

export const ExplorePage = () => {
  const { items, nextCursor, loading, error, loadMore, retry } = useExplorePortfolios()

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Discover"
        title="Explore portfolios"
        description="Recently minted or updated portfolios from the indexer. Each card is checked against the Folder contract when it scrolls into view."
      />
      {items.length > 0 ? (
        <ul className="explore-list" aria-label="Recent portfolios">
          {items.map((item) => (
            <ExploreCard key={item.owner} item={item} />
          ))}
        </ul>
      ) : null}
      {loading ? <LoadingState label="Loading portfolios…" /> : null}
      {error ? (
        <>
          <ErrorMessage message={error.message} />
          <div className="explore-more">
            <Button variant="secondary" onClick={retry}>
              Retry
            </Button>
          </div>
        </>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No portfolios yet" description="The indexer has not seen any minted portfolios." />
      ) : null}
      {!loading && !error && nextCursor ? (
        <div className="explore-more">
          <Button variant="secondary" onClick={loadMore}>
            Load more
          </Button>
        </div>
      ) : null}
    </PageContainer>
  )
}
