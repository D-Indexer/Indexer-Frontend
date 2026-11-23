import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { computeRawCidV1 } from '@/services/ipfs/cid'
import { serializePortfolioContent } from '@/services/ipfs/ipfsService'
import { buildFolder, buildPortfolio, OWNER } from '@/testing/fixtures'
import { mockDb } from '@/testing/msw/db'
import { server } from '@/testing/msw/server'
import type { PortfolioContent } from '@/types'
import { PublicPortfolioPage } from './PublicPortfolio'

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

const staleContent: PortfolioContent = { ...content, name: 'Jane (stale)' }

let indexerCid: string
let onChainCid: string

describe('PublicPortfolioPage', () => {
  beforeEach(async () => {
    const stale = serializePortfolioContent(staleContent)
    const current = serializePortfolioContent(content)
    indexerCid = await computeRawCidV1(stale)
    onChainCid = await computeRawCidV1(current)
    mockDb.folders.set(OWNER, buildFolder({ templateId: 3 }))
    mockDb.portfolios.set(OWNER, buildPortfolio({ templateId: 3, ipfsCid: indexerCid }))
    mockDb.ipfs.set(indexerCid, stale)
    mockDb.ipfs.set(onChainCid, current)
    mockDb.chainPortfolios.set(OWNER, { ipfsCid: onChainCid, templateId: 3, mintedAt: 0 })
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
    expect(screen.queryByText('Jane (stale)')).not.toBeInTheDocument()
  })

  it('shows "not found" for an unknown folder', async () => {
    renderPage('nobody.folder')
    expect(await screen.findByRole('heading', { name: 'Folder not found' })).toBeInTheDocument()
  })

  it('does not claim verification when the contract cannot be reached', async () => {
    server.use(http.post(env.sorobanRpcUrl, () => HttpResponse.error()))
    renderPage()
    expect(await screen.findByText('Verification unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Verified on Stellar')).not.toBeInTheDocument()
    // Falls back to the indexer CID.
    expect(await screen.findByRole('heading', { level: 1, name: 'Jane (stale)' })).toBeInTheDocument()
  })

  it('handles a claimed folder without a portfolio', async () => {
    mockDb.portfolios.clear()
    mockDb.chainPortfolios.clear()
    renderPage()
    expect(await screen.findByText(/has not minted a portfolio yet/)).toBeInTheDocument()
    expect(screen.getByText('Not verified')).toBeInTheDocument()
  })

  it('explains when IPFS content cannot be loaded', async () => {
    mockDb.ipfs.clear()
    renderPage()
    expect(await screen.findByText(/could not be loaded from IPFS: The IPFS gateway returned 504/)).toBeInTheDocument()
    expect(screen.getByText('Verified on Stellar')).toBeInTheDocument()
  })

  it('shows backend errors with a retry button', async () => {
    server.use(http.get(`${env.apiUrl}/folders/name/:name`, () => HttpResponse.error(), { once: true }))
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Jane Doe' })).toBeInTheDocument()
  })
})
