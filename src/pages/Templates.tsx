import { SectionHeader } from '@/components/ui'
import { TemplateGrid } from '@/features/templates'
import { PageContainer } from '@/layouts'

export const TemplatesPage = () => {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Marketplace"
        title="Portfolio templates"
        description="Templates registered on the Folder contract, as indexed by the backend. Their metadata is read from IPFS."
      />
      <TemplateGrid />
    </PageContainer>
  )
}
