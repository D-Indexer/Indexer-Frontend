import { SectionHeader } from '@/components/ui'
import { StatusPanel } from '@/features/status'
import { PageContainer } from '@/layouts'

export const StatusPage = () => {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Observability"
        title="System status"
        description="Live health and latency for the Soroban RPC, the Indexer backend and the IPFS gateway, plus how far the indexer trails the chain."
      />
      <StatusPanel />
    </PageContainer>
  )
}
