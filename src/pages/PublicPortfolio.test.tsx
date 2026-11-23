import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFolder, buildPortfolio, CID_V1, CID_V2, OWNER } from '@/testing/fixtures'
import type { PortfolioContent } from '@/types'

const data = vi.hoisted(() => ({ getFolderByName: vi.fn(), getPortfolio: vi.fn(), getPortfolioContent: vi.fn() }))
const chain = vi.hoisted(() => ({ verifyPortfolio: vi.fn(), getOnChainPortfolio: vi.fn() }))
vi.mock('@/services/data/folderData', () => ({ folderData: data }))
vi.mock('@/services/stellar/stellarService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/stellar/stellarService')>()
  return { ...original, stellarService: { ...original.stellarService, ...chain } }
})

const { PublicPortfolioPage } = await import('./PublicPortfolio')

const content: PortfolioContent = {
  schema_version: 1,
  folder: 'jane.folder',
  template_id: 3,
  name: 'Jane Doe',
  headline: 'Operations lead',
  bio: 'I run things.',
  skills: ['Planning'],
  links: ['https://example.com'],
  sections: { experience: 'Ten years at Acme.', certifications: 'PMP' },
  updated_at: '',
}

const renderPage = (name = 'jane.folder') =>
  render(
    <MemoryRouter initialEntries={[`/p/${name}`]}>
      <Routes>
        <Route path="/p/:folderName" element={<PublicPortfolioPage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('PublicPortfolioPage', () => {
  beforeEach(() => {
    Object.values({ ...data, ...chain }).forEach((fn) => fn.mockReset())
    data.getFolderByName.mockResolvedValue(buildFolder({ templateId: 3 }))
    data.getPortfolio.mockResolvedValue(buildPortfolio({ templateId: 3, ipfsCid: CID_V1 }))
    data.getPortfolioContent.mockResolvedValue(content)
    chain.verifyPortfolio.mockResolvedValue(true)
    chain.getOnChainPortfolio.mockResolvedValue({ ipfsCid: CID_V2, templateId: 3, mintedAt: 0 })
  })

  it('renders the portfolio with its template and a "Verified on Stellar" badge', async () => {
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Loading jane.folder…')
    expect(await screen.findByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument()
    expect(screen.getByText('Verified on Stellar')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Owner's transactions/ })).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/testnet/account/${OWNER}`,
    )
    // The on-chain CID wins over a possibly stale indexer CID.
    expect(data.getPortfolioContent).toHaveBeenCalledWith(CID_V2)
    expect(chain.verifyPortfolio).toHaveBeenCalledWith(OWNER)
  })

  it('shows "not found" for an unknown folder', async () => {
    data.getFolderByName.mockResolvedValue(null)
    renderPage('nobody.folder')
    expect(await screen.findByRole('heading', { name: 'Folder not found' })).toBeInTheDocument()
  })

  it('does not claim verification when the contract cannot be reached', async () => {
    chain.verifyPortfolio.mockRejectedValue(new Error('RPC timeout'))
    renderPage()
    expect(await screen.findByText('Verification unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Verified on Stellar')).not.toBeInTheDocument()
    expect(data.getPortfolioContent).toHaveBeenCalledWith(CID_V1)
  })

  it('handles a claimed folder without a portfolio', async () => {
    data.getPortfolio.mockResolvedValue(null)
    chain.verifyPortfolio.mockResolvedValue(false)
    chain.getOnChainPortfolio.mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText(/has not minted a portfolio yet/)).toBeInTheDocument()
    expect(screen.getByText('Not verified')).toBeInTheDocument()
  })

  it('explains when IPFS content cannot be loaded', async () => {
    data.getPortfolioContent.mockRejectedValue(new Error('The IPFS gateway returned 504'))
    renderPage()
    expect(await screen.findByText(/could not be loaded from IPFS: The IPFS gateway returned 504/)).toBeInTheDocument()
    expect(screen.getByText('Verified on Stellar')).toBeInTheDocument()
  })

  it('shows backend errors with a retry button', async () => {
    data.getFolderByName.mockRejectedValueOnce(new Error('Could not reach the Folder backend.'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the Folder backend.')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument()
  })

  it('renders indexed content as "Verifying…" before the chain answers, then uses it when CIDs match', async () => {
    let resolveChain: (value: boolean) => void = () => undefined
    chain.verifyPortfolio.mockReturnValue(new Promise<boolean>((resolve) => (resolveChain = resolve)))
    chain.getOnChainPortfolio.mockResolvedValue({ ipfsCid: CID_V1, templateId: 3, mintedAt: 0 })
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument()
    expect(screen.getByText('Verifying…')).toBeInTheDocument()
    expect(screen.queryByText('Verified on Stellar')).not.toBeInTheDocument()
    resolveChain(true)
    expect(await screen.findByText('Verified on Stellar')).toBeInTheDocument()
    expect(data.getPortfolioContent).toHaveBeenCalledTimes(1)
  })

  it('discards the speculative content and fetches the on-chain CID when they differ', async () => {
    let resolveChain: (value: boolean) => void = () => undefined
    chain.verifyPortfolio.mockReturnValue(new Promise<boolean>((resolve) => (resolveChain = resolve)))
    data.getPortfolioContent.mockImplementation(async (cid: string) => ({ ...content, name: cid === CID_V1 ? 'Stale Name' : 'Jane Doe' }))
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Stale Name' })).toBeInTheDocument()
    expect(screen.queryByText('Verified on Stellar')).not.toBeInTheDocument()
    resolveChain(true)
    expect(await screen.findByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument()
    expect(screen.getByText('Verified on Stellar')).toBeInTheDocument()
    expect(data.getPortfolioContent).toHaveBeenCalledWith(CID_V2)
  })

  it('renders Markdown for content_format "markdown" and keeps older documents as plain text', async () => {
    data.getPortfolioContent.mockResolvedValue({ ...content, bio: 'I **run** things.', content_format: 'markdown' })
    const { unmount } = renderPage()
    expect(await screen.findByText('run')).toHaveProperty('tagName', 'STRONG')
    unmount()
    data.getPortfolioContent.mockResolvedValue({ ...content, bio: 'I **run** things.' })
    renderPage()
    expect(await screen.findByText('I **run** things.')).toBeInTheDocument()
  })
})
