import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFolder, OWNER } from '@/testing/fixtures'

const data = vi.hoisted(() => ({ getFolderByOwner: vi.fn() }))
vi.mock('@/services/data/folderData', () => ({ folderData: data }))

const { PublicByAddressPage } = await import('./PublicByAddress')

const Target = () => <p>Folder page {useParams().folderName}</p>

const renderAt = (address: string) =>
  render(
    <MemoryRouter initialEntries={[`/a/${address}`]}>
      <Routes>
        <Route path="/a/:address" element={<PublicByAddressPage />} />
        <Route path="/p/:folderName" element={<Target />} />
      </Routes>
    </MemoryRouter>,
  )

describe('PublicByAddressPage', () => {
  beforeEach(() => {
    data.getFolderByOwner.mockReset()
    data.getFolderByOwner.mockResolvedValue(buildFolder())
  })

  it('redirects a valid owner address to the canonical folder page', async () => {
    renderAt(OWNER)
    expect(await screen.findByText(`Folder page ${buildFolder().name}`)).toBeInTheDocument()
    expect(data.getFolderByOwner).toHaveBeenCalledWith(OWNER)
  })

  it('shows an invalid-address message without querying the indexer', () => {
    renderAt('not-an-address')
    expect(screen.getByRole('heading', { name: 'Invalid address' })).toBeInTheDocument()
    expect(data.getFolderByOwner).not.toHaveBeenCalled()
  })

  it('shows a distinct message for an address with no folder', async () => {
    data.getFolderByOwner.mockResolvedValue(null)
    renderAt(OWNER)
    expect(await screen.findByRole('heading', { name: 'No folder for this address' })).toBeInTheDocument()
  })
})
