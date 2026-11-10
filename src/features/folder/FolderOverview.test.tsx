import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const data = vi.hoisted(() => ({ getFolderByOwner: vi.fn(), getPortfolio: vi.fn() }))
vi.mock('@/services/data/folderData', () => ({ folderData: data }))

const { FolderOverview } = await import('./components/FolderOverview')

const OWNER = 'GAPAMTTVHB7RZ5DQHEINZN3GQYRCXXWNCQNQSY5YAU6RKQUYX2QJT2CM'
const CID = 'bafkreifwfa7v77kn2om36djjtqiwqykldpady3ytsfbqkqgcrfilhjqtnu'

const renderOverview = () =>
  render(
    <MemoryRouter>
      <FolderOverview address={OWNER} />
    </MemoryRouter>,
  )

describe('FolderOverview', () => {
  beforeEach(() => {
    data.getFolderByOwner.mockReset()
    data.getPortfolio.mockReset()
  })

  it('shows loading, then the folder and its portfolio', async () => {
    data.getFolderByOwner.mockResolvedValue({ owner: OWNER, name: 'jane.folder', templateId: 1, claimedAt: '2026-11-09T22:22:27.000Z', updatedAt: '' })
    data.getPortfolio.mockResolvedValue({ owner: OWNER, templateId: 1, ipfsCid: CID, mintedAt: '', updatedAt: '2026-11-09T22:23:52.000Z' })
    renderOverview()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your folder…')
    expect(await screen.findByText('jane.folder')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(CID) })).toHaveAttribute('href', `https://ipfs.io/ipfs/${CID}`)
    expect(screen.getByRole('link', { name: 'View public page' })).toHaveAttribute('href', '/p/jane.folder')
  })

  it('shows an empty state when the address has no folder', async () => {
    data.getFolderByOwner.mockResolvedValue(null)
    data.getPortfolio.mockResolvedValue(null)
    renderOverview()
    expect(await screen.findByRole('heading', { name: 'No folder claimed yet' })).toBeInTheDocument()
  })

  it('shows backend errors with a retry button', async () => {
    data.getFolderByOwner.mockRejectedValueOnce(new Error('Could not reach the Folder backend.')).mockResolvedValue(null)
    data.getPortfolio.mockResolvedValue(null)
    renderOverview()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the Folder backend.')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'No folder claimed yet' })).toBeInTheDocument()
  })
})
