import { useState } from 'react'
import { Button, SectionHeader } from '@/components/ui'
import { RegisterTemplateModal, TemplateGrid } from '@/features/templates'
import { PageContainer } from '@/layouts'

export const TemplatesPage = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  return (
    <PageContainer>
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          eyebrow="Marketplace"
          title="Portfolio templates"
          description="Templates registered on the Folder contract, as indexed by the backend. Their metadata is read from IPFS."
        />
        <Button type="button" onClick={() => setIsRegisterOpen(true)}>
          Register Template
        </Button>
      </div>

      <TemplateGrid />

      <RegisterTemplateModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          // Window reload or refetch after successful registration
        }}
      />
    </PageContainer>
  )
}
