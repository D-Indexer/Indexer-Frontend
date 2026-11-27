import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TemplateMetadataStatus, TemplateWithMetadata } from '@/types'
import { TemplateCard } from './TemplateCard'

const createTemplate = (status: TemplateMetadataStatus): TemplateWithMetadata => ({
  id: 1,
  metadataUri: 'ipfs://bafkreiabc',
  creator: null,
  registeredAt: '2026-11-09T00:00:00.000Z',
  metadataStatus: status,
  metadata:
    status === 'missing' || status === 'error' || status === 'mismatch'
      ? null
      : {
          schema_version: 1,
          template_id: 1,
          name: 'Developer',
          description: 'Dev template',
          target_industry: 'Tech',
          fields: ['bio'],
        },
})

describe('TemplateCard Metadata Integrity Status', () => {
  it('renders verified badge for verified templates', () => {
    render(<TemplateCard template={createTemplate('verified')} />)
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('renders unverified badge for unverified templates', () => {
    render(<TemplateCard template={createTemplate('unverified')} />)
    expect(screen.getByText('Unverified')).toBeInTheDocument()
  })

  it('renders missing badge for missing metadata', () => {
    render(<TemplateCard template={createTemplate('missing')} />)
    expect(screen.getByText('Missing')).toBeInTheDocument()
  })

  it('renders gateway error badge for error status', () => {
    render(<TemplateCard template={createTemplate('error')} />)
    expect(screen.getByText('Gateway error')).toBeInTheDocument()
  })

  it('renders mismatch badge and disables selection button for tampered templates', () => {
    render(
      <TemplateCard
        template={createTemplate('mismatch')}
        action={<button type="button">Select Template</button>}
      />,
    )
    expect(screen.getByText('Hash mismatch')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Select Template' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tampered/ })).toBeDisabled()
  })
})
