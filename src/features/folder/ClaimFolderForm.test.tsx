import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWalletStore } from '@/store'
import { connectTestnetWallet, OWNER } from '@/testing/fixtures'
import { mockDb } from '@/testing/msw/db'

// Freighter is a browser extension, not an HTTP service; everything else goes through MSW.
const signTransaction = vi.hoisted(() => vi.fn((xdr: string) => Promise.resolve(xdr)))
vi.mock('@/services/stellar/freighterWallet', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/stellar/freighterWallet')>()
  return { ...original, freighterWallet: { ...original.freighterWallet, signTransaction } }
})

const { ClaimFolderForm } = await import('./components/ClaimFolderForm')

describe('ClaimFolderForm', () => {
  beforeEach(() => {
    signTransaction.mockClear()
    connectTestnetWallet()
  })

  it('shows validation errors next to the field and does not submit', async () => {
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    const input = screen.getByLabelText(/Folder name/)
    await userEvent.type(input, 'Jo')
    await userEvent.click(screen.getByRole('button', { name: 'Claim folder' }))

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Use at least 3 characters before .folder.'))
    expect(input).toHaveFocus()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(mockDb.transactions.size).toBe(0)
  })

  it('claims <name>.folder and links the transaction on stellar.expert', async () => {
    const onClaimed = vi.fn()
    render(<ClaimFolderForm owner={OWNER} onClaimed={onClaimed} />)
    await userEvent.type(screen.getByLabelText(/Folder name/), 'jane-doe')
    await userEvent.click(screen.getByRole('button', { name: 'Claim folder' }))

    const [hash] = await vi.waitFor(() => {
      expect(onClaimed).toHaveBeenCalledOnce()
      return onClaimed.mock.calls[0] as [string]
    })
    expect(signTransaction).toHaveBeenCalledWith(expect.any(String), OWNER, expect.any(String))
    expect(mockDb.transactions.has(hash)).toBe(true)
    expect(mockDb.folders.get(OWNER)).toMatchObject({ name: 'jane-doe.folder' })
    expect(await screen.findByRole('link', { name: new RegExp(hash.slice(0, 8)) })).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/testnet/tx/${hash}`,
    )
  })

  it('shows the mapped contract error', async () => {
    mockDb.rpcErrors.set('claim_folder', 'HostError: Error(Contract, #3)')
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/Folder name/), 'taken')
    await userEvent.click(screen.getByRole('button', { name: 'Claim folder' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That folder name is already taken.')
    expect(signTransaction).not.toHaveBeenCalled()
  })

  it('is disabled when the wallet is on the wrong network', () => {
    useWalletStore.setState({ network: 'PUBLIC', networkPassphrase: 'Public Global Stellar Network ; September 2015' })
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Claim folder' })).toBeDisabled()
  })
})
