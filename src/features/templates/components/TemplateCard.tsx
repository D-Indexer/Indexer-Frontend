import { Badge, Card, Identifier } from '@/components/ui'
import { cidFromIpfsUri, ipfsService } from '@/services'
import type { TemplateWithMetadata } from '@/types'
import { humanizeField, sanitizeDisplayText } from '@/utils/format'

interface TemplateCardProps {
  action?: React.ReactNode
  headingLevel?: 2 | 3
  template: TemplateWithMetadata
}

const statusBadges: Record<TemplateMetadataStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; tooltip: string }> = {
  verified: { tone: 'success', label: 'Verified', tooltip: 'Metadata hash matches IPFS CID' },
  unverified: { tone: 'neutral', label: 'Unverified', tooltip: 'Non-raw CID cannot be verified in browser' },
  missing: { tone: 'warning', label: 'Missing', tooltip: 'Metadata file was not found on IPFS gateway' },
  mismatch: { tone: 'danger', label: 'Hash mismatch', tooltip: 'Metadata content does not match on-chain CID! Tampering detected.' },
  error: { tone: 'danger', label: 'Gateway error', tooltip: 'Failed to retrieve metadata due to network error' },
}

export const TemplateCard = ({ action, headingLevel = 2, template }: TemplateCardProps) => {
  const Heading = `h${headingLevel}` as const
  const { metadata, metadataStatus = 'unverified' } = template
  const cid = cidFromIpfsUri(template.metadataUri)
  const headingId = `template-${template.id}-title`
  const isMismatch = metadataStatus === 'mismatch'
  const statusInfo = statusBadges[metadataStatus] ?? statusBadges.unverified

  return (
    <Card className={`template-card ${isMismatch ? 'template-card--disabled opacity-75' : ''}`} aria-labelledby={headingId} role="article">
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
        {isMismatch ? (
          <button type="button" disabled className="btn btn--secondary opacity-50 cursor-not-allowed text-xs">
            Tampered (disabled)
          </button>
        ) : (
          action
        )}
      </div>
    </Card>
  )
}
