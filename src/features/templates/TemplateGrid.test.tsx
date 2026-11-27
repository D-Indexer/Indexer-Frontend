import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultServices } from '@/services'
import { renderWithServices } from '@/testing/renderWithServices'
import type { TemplateWithMetadata } from '@/types'
import { TemplateGrid } from './components/TemplateGrid'

const template: TemplateWithMetadata = {
  id: 1,
  metadataUri: 'ipfs://bafkreiejxg6d3gqvi3737mcwxkv4u7gismaraxgv5zfoqtfuc3nbdgve7i',
  creator: null,
  registeredAt: '2026-11-09T22:14:42.000Z',
  metadataStatus: 'verified',
  metadata: {
    schema_version: 1,
    template_id: 1,
    name: 'Developer',
    description: 'Clean single-page layout for software engineers.',
    target_industry: 'Software Engineering',
    fields: ['bio', 'work_history'],
  },
}

describe('TemplateGrid with ServicesProvider dependency injection', () => {
  const fakeFolderData = {
    ...defaultServices.folderData,
    listTemplates: vi.fn<() => Promise<TemplateWithMetadata[]>>(),
  }

  const renderGrid = () =>
    renderWithServices(
      <MemoryRouter>
        <TemplateGrid />
      </MemoryRouter>,
      { folderData: fakeFolderData },
    )

  beforeEach(() => {
    fakeFolderData.listTemplates.mockReset()
  })

  it('shows a loading state, then the templates', async () => {
    fakeFolderData.listTemplates.mockResolvedValue([template])
    renderGrid()
    expect(screen.getByRole('status')).toHaveTextContent('Loading templates…')
    expect(await screen.findByRole('heading', { name: 'Developer' })).toBeInTheDocument()
    expect(screen.getByText('Work history')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Use template Developer' })).toHaveAttribute('href', '/dashboard?template=1')
  })

  it('shows an empty state when no templates are registered', async () => {
    fakeFolderData.listTemplates.mockResolvedValue([])
    renderGrid()
    expect(await screen.findByRole('heading', { name: 'No templates registered yet' })).toBeInTheDocument()
  })

  it('shows the error with a retry button instead of fake data', async () => {
    fakeFolderData.listTemplates.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce([template])
    renderGrid()
    expect(await screen.findByRole('alert')).toHaveTextContent('Network Error')
    expect(screen.queryByRole('heading', { name: 'Developer' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Developer' })).toBeInTheDocument()
    expect(fakeFolderData.listTemplates).toHaveBeenCalledTimes(2)
  })

  it('says when template metadata is unavailable rather than inventing it', async () => {
    fakeFolderData.listTemplates.mockResolvedValue([{ ...template, metadata: null, metadataStatus: 'missing' }])
    renderGrid()
    expect(await screen.findByRole('heading', { name: 'Template 1' })).toBeInTheDocument()
    expect(screen.getByText('Missing')).toBeInTheDocument()
  })
})
