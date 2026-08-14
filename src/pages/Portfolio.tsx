import { useParams } from 'react-router-dom'
import { ErrorMessage, LoadingState, SectionHeader } from '@/components/ui'
import { PortfolioStatusCard } from '@/features/portfolio'
import { VerificationChecklist } from '@/features/verification'
import { usePortfolio } from '@/hooks'
import { PageContainer } from '@/layouts'

export const PortfolioPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: portfolio, error, loading } = usePortfolio(id)

  if (loading) {
    return (
      <PageContainer>
        <LoadingState label="Loading portfolio…" />
      </PageContainer>
    )
  }

  if (error || !portfolio) {
    return (
      <PageContainer>
        <ErrorMessage message={error?.message ?? 'Portfolio not found'} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Portfolio"
        title={`Portfolio ${portfolio.id}`}
        description="Current portfolio status and immutable metadata reference."
      />
      <div className="grid grid--2">
        <PortfolioStatusCard portfolio={portfolio} />
        <VerificationChecklist status={portfolio.status} />
      </div>
    </PageContainer>
  )
}
