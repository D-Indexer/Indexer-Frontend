import { Badge, Card, Identifier } from '@/components/ui'
import { cidFromIpfsUri, ipfsService } from '@/services'
import type { TemplateWithMetadata } from '@/types'
import { humanizeField, sanitizeDisplayText } from '@/utils/format'

interface TemplateCardProps {
  action?: React.ReactNode
  /** Heading level for the card title, so it nests under the surrounding heading. */
  headingLevel?: 2 | 3
  template: TemplateWithMetadata
}

export const TemplateCard = ({ action, headingLevel = 2, template }: TemplateCardProps) => {
  const Heading = `h${headingLevel}` as const
  const { metadata } = template
  const cid = cidFromIpfsUri(template.metadataUri)
  const headingId = `template-${template.id}-title`

  return (
    <Card className="template-card" aria-labelledby={headingId} role="article">
      <div className="cluster">
        <Badge>Template #{template.id}</Badge>
        {metadata ? (
          <Badge tone="success">
            <bdi>{sanitizeDisplayText(metadata.target_industry, 64)}</bdi>
          </Badge>
        ) : (
          <Badge tone="warning">Metadata unavailable</Badge>
        )}
      </div>
      <div>
        <Heading id={headingId} className="template-card__title">
          <bdi>{sanitizeDisplayText(metadata?.name ?? `Template ${template.id}`, 120)}</bdi>
        </Heading>
        <p className="muted">
          <bdi>
            {sanitizeDisplayText(
              metadata?.description ??
                'The metadata for this template could not be loaded from IPFS. It is registered on-chain and can still be used.',
            )}
          </bdi>
        </p>
      </div>
      {metadata ? (
        <ul className="tag-list" aria-label="Fields">
          {metadata.fields.map((field) => (
            <li key={field}>
              <bdi>{humanizeField(sanitizeDisplayText(field, 64))}</bdi>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="template-card__footer">
        {cid ? (
          <Identifier className="muted small" label="Metadata CID" value={cid} href={ipfsService.gatewayUrl(cid)} visible={6} />
        ) : null}
        {action}
      </div>
    </Card>
  )
}
