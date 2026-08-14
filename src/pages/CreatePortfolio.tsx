import { SectionHeader } from '@/components/ui'
import { PortfolioEditor } from '@/features/portfolio'
import { PageContainer } from '@/layouts'

export const CreatePortfolioPage = () => {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Create"
        title="Create a verifiable portfolio"
        description="Write the portfolio metadata, upload it to IPFS, and submit the CID to the Folder API."
      />
      <PortfolioEditor />
    </PageContainer>
  )
}
