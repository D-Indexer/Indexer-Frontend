import { SectionHeader } from '@/components/ui'
import { Hero } from '@/features/home'
import { TemplateGrid } from '@/features/templates'
import { PageContainer } from '@/layouts'

export const HomePage = () => {
  return (
    <PageContainer>
      <Hero />
      <section className="stack">
        <SectionHeader
          level={2}
          eyebrow="Templates"
          title="Start from a structured portfolio"
          description="Use a template as the schema for metadata, credentials, and proof-of-work display."
        />
        <TemplateGrid />
      </section>
    </PageContainer>
  )
}
