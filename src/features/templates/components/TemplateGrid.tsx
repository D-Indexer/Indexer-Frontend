import { EmptyState, ErrorMessage, LoadingState } from '@/components/ui'
import { useTemplates } from '@/hooks'
import { TemplateCard } from './TemplateCard'

export const TemplateGrid = () => {
  const { data: templates, error, loading } = useTemplates()

  if (loading) {
    return <LoadingState label="Loading portfolio templates…" />
  }

  if (error) {
    return <ErrorMessage message={error.message} />
  }

  if (!templates?.length) {
    return (
      <EmptyState
        title="No templates available"
        description="Connect the Folder API or add templates to get started."
      />
    )
  }

  return (
    <div className="grid grid--3">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  )
}
