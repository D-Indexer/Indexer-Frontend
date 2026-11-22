import React from 'react'
import { Badge, Card, ExternalLink } from '@/components/ui'
import { cidFromIpfsUri, ipfsService } from '@/services'
import type { TemplateMetadataStatus, TemplateWithMetadata } from '@/types'
import { humanizeField } from '@/utils/format'

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
        {metadata ? <Badge tone="success">{metadata.target_industry}</Badge> : null}
        <span title={statusInfo.tooltip}>
          <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
        </span>
      </div>
      <div>
        <Heading id={headingId} className="template-card__title">
          {metadata?.name ?? `Template ${template.id}`}
        </Heading>
        <p className="muted">
          {metadata?.description ??
            (isMismatch
              ? 'Warning: This template metadata failed CID integrity verification. Selection is disabled.'
              : 'The metadata for this template could not be loaded from IPFS. It is registered on-chain and can still be used.')}
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
