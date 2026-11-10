import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWalletStore } from '@/store'
import { connectTestnetWallet, OWNER, TX_HASH } from '@/testing/fixtures'

const invoke = vi.hoisted(() => vi.fn())
vi.mock('@/services/stellar/stellarService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/stellar/stellarService')>()
  return { ...original, stellarService: { ...original.stellarService, invoke } }
})

const { ClaimFolderForm } = await import('./components/ClaimFolderForm')
const { TransactionError } = await import('@/services/stellar/stellarService')

describe('ClaimFolderForm', () => {
  beforeEach(() => {
    invoke.mockReset()
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
    expect(invoke).not.toHaveBeenCalled()
  })

  it('claims <name>.folder and links the transaction on stellar.expert', async () => {
    invoke.mockResolvedValue({ hash: TX_HASH, ledger: 1 })
    const onClaimed = vi.fn()
    render(<ClaimFolderForm owner={OWNER} onClaimed={onClaimed} />)
    await userEvent.type(screen.getByLabelText(/Folder name/), 'jane-doe')
    await userEvent.click(screen.getByRole('button', { name: 'Claim folder' }))

    expect(invoke).toHaveBeenCalledWith(OWNER, { method: 'claim_folder', folderName: 'jane-doe.folder' }, expect.any(Function), expect.any(Function))
    expect(onClaimed).toHaveBeenCalledWith(TX_HASH)
    expect(await screen.findByRole('link', { name: /3f659a42/ })).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`,
    )
  })

  it('shows the mapped contract error', async () => {
    invoke.mockRejectedValue(new TransactionError('That folder name is already taken. Try another one.', { contractErrorCode: 3 }))
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/Folder name/), 'taken')
    await userEvent.click(screen.getByRole('button', { name: 'Claim folder' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That folder name is already taken.')
  })

  it('is disabled when the wallet is on the wrong network', () => {
    useWalletStore.setState({ network: 'PUBLIC', networkPassphrase: 'Public Global Stellar Network ; September 2015' })
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Claim folder' })).toBeDisabled()
  })
})
