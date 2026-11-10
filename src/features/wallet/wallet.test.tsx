import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TESTNET_PASSPHRASE } from '@/services/stellar/network'
import { useWalletStore } from '@/store'

const freighter = vi.hoisted(() => ({
  connect: vi.fn(),
  restore: vi.fn(),
  watch: vi.fn(() => () => undefined),
}))

vi.mock('@/services/stellar/freighterWallet', () => ({
  freighterWallet: freighter,
  WalletError: class extends Error {},
}))

vi.mock('@/config/env', () => ({ env: { demoMode: false } }))

const { WalletButton } = await import('./components/WalletButton')
const { WalletGate } = await import('./components/WalletGate')

const ADDRESS = 'GAPAMTTVHB7RZ5DQHEINZN3GQYRCXXWNCQNQSY5YAU6RKQUYX2QJT2CM'

describe('wallet', () => {
  beforeEach(() => {
    useWalletStore.setState({ address: null, network: null, networkPassphrase: null, status: 'idle', error: null })
    freighter.restore.mockResolvedValue(null)
  })

  it('connects, shows the address and network, and disconnects', async () => {
    freighter.connect.mockResolvedValue({ address: ADDRESS, network: 'TESTNET', networkPassphrase: TESTNET_PASSPHRASE })
    render(<WalletButton />)

    await userEvent.click(screen.getByRole('button', { name: 'Connect Freighter' }))
    expect(await screen.findByText('GAPA…T2CM')).toBeInTheDocument()
    expect(screen.getByText('Testnet')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }))
    expect(screen.getByRole('button', { name: 'Connect Freighter' })).toBeInTheDocument()
  })

  it('shows connection errors next to the button', async () => {
    freighter.connect.mockRejectedValue(new Error('Freighter is not installed.'))
    render(<WalletButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Connect Freighter' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Freighter is not installed.')
  })

  it('blocks gated actions until a testnet wallet is connected', async () => {
    const { rerender } = render(<WalletGate>{(address) => <p>ready {address}</p>}</WalletGate>)
    expect(screen.getByText('Connect your Freighter wallet to continue.')).toBeInTheDocument()

    useWalletStore.setState({ address: ADDRESS, network: 'PUBLIC', networkPassphrase: 'Public Global Stellar Network ; September 2015', status: 'connected' })
    rerender(<WalletGate>{(address) => <p>ready {address}</p>}</WalletGate>)
    expect(screen.getByText(/Switch Freighter to Testnet/)).toBeInTheDocument()

    useWalletStore.setState({ networkPassphrase: TESTNET_PASSPHRASE, network: 'TESTNET' })
    rerender(<WalletGate>{(address) => <p>ready {address}</p>}</WalletGate>)
    await waitFor(() => expect(screen.getByText(`ready ${ADDRESS}`)).toBeInTheDocument())
  })
})
