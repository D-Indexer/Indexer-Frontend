import { Badge, Card, ExternalLink } from '@/components/ui'
import { cidFromIpfsUri, ipfsService } from '@/services'
import type { TemplateWithMetadata } from '@/types'
import { humanizeField } from '@/utils/format'

interface TemplateCardProps {
  action?: React.ReactNode
  template: TemplateWithMetadata
}

export const TemplateCard = ({ action, template }: TemplateCardProps) => {
  const { metadata } = template
  const cid = cidFromIpfsUri(template.metadataUri)
  const headingId = `template-${template.id}-title`

  return (
    <Card className="template-card" aria-labelledby={headingId} role="article">
      <div className="cluster">
        <Badge>Template #{template.id}</Badge>
        {metadata ? <Badge tone="success">{metadata.target_industry}</Badge> : <Badge tone="warning">Metadata unavailable</Badge>}
      </div>
      <div>
        <h3 id={headingId}>{metadata?.name ?? `Template ${template.id}`}</h3>
        <p className="muted">
          {metadata?.description ??
            'The metadata for this template could not be loaded from IPFS. It is registered on-chain and can still be used.'}
        </p>
      </div>
      {metadata ? (
        <ul className="tag-list" aria-label="Fields">
          {metadata.fields.map((field) => (
            <li key={field}>{humanizeField(field)}</li>
          ))}
        </ul>
      ) : null}
      <div className="template-card__footer">
        {cid ? (
          <ExternalLink href={ipfsService.gatewayUrl(cid)} className="muted mono small">
            {cid.slice(0, 12)}…
          </ExternalLink>
        ) : null}
        {action}
      </div>
    </Card>
  )
}
