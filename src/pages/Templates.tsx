import { SectionHeader } from '@/components/ui'
import { TemplateGrid } from '@/features/templates'
import { PageContainer } from '@/layouts'

export const TemplatesPage = () => {
  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Marketplace"
        title="Portfolio templates"
        description="Template data is loaded from the configured Folder API, with local starter templates available during development."
      />
      <TemplateGrid />
    </PageContainer>
  )
}
