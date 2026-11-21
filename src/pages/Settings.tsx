import { SectionHeader } from '@/components/ui'
import { SettingsPanel } from '@/features/settings'
import { PageContainer } from '@/layouts'

export const SettingsPage = () => (
  <PageContainer>
    <SectionHeader
      eyebrow="Settings"
      title="Privacy and local data"
      description="Control what this browser keeps between visits. Nothing here changes your on-chain folder."
    />
    <SettingsPanel />
  </PageContainer>
)
