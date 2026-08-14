import { SectionHeader } from '@/components/ui'
import { Hero, StatsPanel } from '@/features/home'
import { TemplateGrid } from '@/features/templates'
import { PageContainer } from '@/layouts'

export const HomePage = () => {
  return (
    <PageContainer>
      <Hero />
      <StatsPanel />
      <section className="stack">
        <SectionHeader
          eyebrow="Templates"
          title="Start from a structured portfolio"
          description="Use a template as the schema for metadata, credentials, and proof-of-work display."
        />
        <TemplateGrid />
      </section>
    </PageContainer>
  )
}
