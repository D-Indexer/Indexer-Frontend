import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { OWNER } from '@/testing/fixtures'
import { useWalletStore } from '@/store'
import { OwnerToolbar } from './OwnerToolbar'

const OTHER = 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H'

const renderToolbar = () =>
  render(
    <MemoryRouter>
      <OwnerToolbar owner={OWNER} />
    </MemoryRouter>,
  )

describe('OwnerToolbar', () => {
  afterEach(() => useWalletStore.setState({ address: null }))

  it('shows edit, share and explorer controls to the owner', () => {
    useWalletStore.setState({ address: OWNER })
    renderToolbar()
    expect(screen.getByRole('link', { name: 'Edit portfolio' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View on explorer/ })).toBeInTheDocument()
  })

  it('renders nothing for a different wallet', () => {
    useWalletStore.setState({ address: OTHER })
    renderToolbar()
    expect(screen.queryByRole('navigation', { name: 'Owner controls' })).not.toBeInTheDocument()
  })

  it('renders nothing when no wallet is connected', () => {
    renderToolbar()
    expect(screen.queryByRole('navigation', { name: 'Owner controls' })).not.toBeInTheDocument()
  })
})
