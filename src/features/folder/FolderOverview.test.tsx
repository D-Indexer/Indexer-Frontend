import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFolder, buildPortfolio, CID_V1, connectTestnetWallet, developerTemplate, OWNER } from '@/testing/fixtures'

const data = vi.hoisted(() => ({
  getFolderByOwner: vi.fn(),
  getPortfolio: vi.fn(),
  getPortfolioContent: vi.fn(),
  listTemplates: vi.fn(),
}))
vi.mock('@/services/data/folderData', () => ({ folderData: data }))

const { FolderOverview } = await import('./components/FolderOverview')

const renderOverview = () =>
  render(
    <MemoryRouter>
      <FolderOverview address={OWNER} />
    </MemoryRouter>,
  )

describe('FolderOverview', () => {
  beforeEach(() => {
    Object.values(data).forEach((fn) => fn.mockReset())
    data.listTemplates.mockResolvedValue([developerTemplate])
    data.getPortfolioContent.mockRejectedValue(new Error('gateway 504'))
    connectTestnetWallet()
  })

  it('shows loading, then the folder, its portfolio and the update form', async () => {
    data.getFolderByOwner.mockResolvedValue(buildFolder({ templateId: 1 }))
    data.getPortfolio.mockResolvedValue(buildPortfolio())
    renderOverview()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your folder…')
    expect(await screen.findByText('jane.folder')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(CID_V1) })).toHaveAttribute('href', `https://ipfs.io/ipfs/${CID_V1}`)
    expect(screen.getByRole('link', { name: 'View public page' })).toHaveAttribute('href', '/p/jane.folder')
    expect(await screen.findByRole('heading', { name: 'Update your portfolio' })).toBeInTheDocument()
  })

  it('offers to claim a folder when the address has none (empty state)', async () => {
    data.getFolderByOwner.mockResolvedValue(null)
    data.getPortfolio.mockResolvedValue(null)
    renderOverview()
    expect(await screen.findByText(/has not claimed a folder yet/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Claim your folder name' })).toBeInTheDocument()
  })

  it('offers to mint when a folder exists but no portfolio', async () => {
    data.getFolderByOwner.mockResolvedValue(buildFolder())
    data.getPortfolio.mockResolvedValue(null)
    renderOverview()
    expect(await screen.findByRole('heading', { name: 'Mint your portfolio' })).toBeInTheDocument()
  })

  it('shows backend errors with a retry button', async () => {
    data.getFolderByOwner.mockRejectedValueOnce(new Error('Could not reach the Folder backend.')).mockResolvedValue(null)
    data.getPortfolio.mockResolvedValue(null)
    renderOverview()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the Folder backend.')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Claim your folder name' })).toBeInTheDocument()
  })
})
