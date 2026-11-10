import { AsyncContent, LinkButton } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { useTemplates } from '@/hooks'
import { TemplateCard } from './TemplateCard'

export const TemplateGrid = () => {
  const { data, error, loading, refetch } = useTemplates()

  return (
    <AsyncContent
      data={data}
      error={error}
      loading={loading}
      loadingLabel="Loading templates…"
      onRetry={() => void refetch()}
      empty={{
        title: 'No templates registered yet',
        description: 'The indexer has not seen any template registrations on the Folder contract.',
      }}
    >
      {(templates) => (
        <div className="grid grid--3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              action={
                <LinkButton to={`${appRoutes.dashboard}?template=${template.id}`} variant="secondary">
                  Use template
                </LinkButton>
              }
            />
          ))}
        </div>
      )}
    </AsyncContent>
  )
}
