import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const renderLayout = async (demoMode: boolean) => {
  vi.resetModules()
  vi.doMock('@/config/env', () => ({
    env: { demoMode, stellarNetwork: 'testnet', folderContractId: 'CDDQK74SMH4RB4HYLHM6BYZPTAMDMRISHW5Q274KADVZVFD57K43O6KV' },
  }))
  const { AppLayout } = await import('./AppLayout')
  render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  it('shows a persistent "Demo data" banner in demo mode', async () => {
    await renderLayout(true)
    expect(screen.getByRole('note', { name: 'Demo data' })).toHaveTextContent('Demo data.')
  })

  it('shows no banner outside demo mode', async () => {
    await renderLayout(false)
    expect(screen.queryByRole('note', { name: 'Demo data' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect Freighter' })).toBeInTheDocument()
  })
})
