import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPortfolio, OWNER } from '@/testing/fixtures'
import type { ExplorePortfolio } from '@/types'

const data = vi.hoisted(() => ({ listPortfolios: vi.fn() }))
const chain = vi.hoisted(() => ({ verifyPortfolio: vi.fn() }))
vi.mock('@/services/data/folderData', () => ({ folderData: data }))
vi.mock('@/services/stellar/stellarService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/stellar/stellarService')>()
  return { ...original, stellarService: { ...original.stellarService, ...chain } }
})

const { ExplorePage } = await import('./Explore')

const item = (folderName: string, owner: string): ExplorePortfolio => ({ ...buildPortfolio({ owner }), folderName })

class FakeObserver {
  static instances: FakeObserver[] = []
  constructor(private callback: IntersectionObserverCallback) {
    FakeObserver.instances.push(this)
  }
  observe = vi.fn()
  disconnect = vi.fn()
  show() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

const renderPage = (path = '/explore') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/explore" element={<ExplorePage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('ExplorePage', () => {
  beforeEach(() => {
    FakeObserver.instances = []
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    data.listPortfolios.mockReset()
    chain.verifyPortfolio.mockReset().mockResolvedValue(true)
    data.listPortfolios.mockResolvedValueOnce({ items: [item('a.folder', OWNER), item('b.folder', 'GB')], nextCursor: 'c2' })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lists portfolios and verifies a card only once it is visible', async () => {
    renderPage()
    expect(await screen.findByRole('link', { name: 'a.folder' })).toHaveAttribute('href', '/p/a.folder')
    expect(chain.verifyPortfolio).not.toHaveBeenCalled()
    await act(async () => FakeObserver.instances[0].show())
    expect(chain.verifyPortfolio).toHaveBeenCalledTimes(1)
    expect(chain.verifyPortfolio).toHaveBeenCalledWith(OWNER)
    expect(await screen.findByText('Verified on Stellar')).toBeInTheDocument()
  })

  it('appends the next page with "Load more" and stops when there is no cursor', async () => {
    data.listPortfolios.mockResolvedValueOnce({ items: [item('c.folder', 'GC')], nextCursor: null })
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }))
    expect(await screen.findByRole('link', { name: 'c.folder' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'a.folder' })).toBeInTheDocument()
    expect(data.listPortfolios).toHaveBeenLastCalledWith('c2', 12)
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('resumes from the cursor in the URL', async () => {
    renderPage('/explore?cursor=abc')
    await screen.findByRole('link', { name: 'a.folder' })
    expect(data.listPortfolios).toHaveBeenCalledWith('abc', 12)
  })

  it('shows an empty state and errors with retry', async () => {
    data.listPortfolios.mockReset()
    data.listPortfolios.mockRejectedValueOnce(new Error('Could not reach the Folder backend.'))
    data.listPortfolios.mockResolvedValueOnce({ items: [], nextCursor: null })
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the Folder backend.')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'No portfolios yet' })).toBeInTheDocument()
  })
})
