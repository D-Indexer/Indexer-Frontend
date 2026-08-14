import { Button, ErrorMessage, LinkButton, LoadingState, SectionHeader } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { DashboardMetrics, PortfolioTable } from '@/features/dashboard'
import { usePortfolios } from '@/hooks'
import { PageContainer } from '@/layouts'
import { usePortfolioStore } from '@/store'

export const DashboardPage = () => {
  const cachedPortfolios = usePortfolioStore((state) => state.portfolios)
  const { data, error, loading, refetch } = usePortfolios()
  const portfolios = data ?? cachedPortfolios

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Dashboard"
        title="Portfolio operations"
        description="Monitor portfolio records, verification progress, and metadata references from one workspace."
        action={<LinkButton to={appRoutes.createPortfolio}>Create portfolio</LinkButton>}
      />

      {loading && portfolios.length === 0 ? <LoadingState label="Loading portfolio records…" /> : null}
      {error ? (
        <div className="stack">
          <ErrorMessage message={error.message} />
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!loading || portfolios.length > 0 ? (
        <div className="stack">
          <DashboardMetrics portfolios={portfolios} />
          <PortfolioTable portfolios={portfolios} />
        </div>
      ) : null}
    </PageContainer>
  )
}
