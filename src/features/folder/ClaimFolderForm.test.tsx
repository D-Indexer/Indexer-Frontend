import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWalletStore } from '@/store'
import { buildFolder, connectTestnetWallet, OWNER, TX_HASH } from '@/testing/fixtures'

const invoke = vi.hoisted(() => vi.fn())
const simulateClaimFolder = vi.hoisted(() => vi.fn())
const getFolderByName = vi.hoisted(() => vi.fn())
vi.mock('@/services/stellar/stellarService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/stellar/stellarService')>()
  return { ...original, stellarService: { ...original.stellarService, invoke, simulateClaimFolder } }
})
vi.mock('@/services/data/folderData', () => ({ folderData: { getFolderByName } }))

const { ClaimFolderForm } = await import('./components/ClaimFolderForm')
const { TransactionError } = await import('@/services/stellar/stellarService')

describe('ClaimFolderForm', () => {
  beforeEach(() => {
    invoke.mockReset()
    simulateClaimFolder.mockReset().mockResolvedValue(undefined)
    getFolderByName.mockReset().mockResolvedValue(null)
    connectTestnetWallet()
  })

  afterEach(() => vi.useRealTimers())

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
    expect(await screen.findByText('This folder name is available.')).toBeInTheDocument()
    expect(simulateClaimFolder).toHaveBeenCalledWith(OWNER, 'jane-doe.folder')
    expect(invoke).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Claim folder' }))

    expect(invoke).toHaveBeenCalledWith(OWNER, { method: 'claim_folder', folderName: 'jane-doe.folder' }, expect.any(Function), expect.any(Function))
    expect(onClaimed).toHaveBeenCalledWith(TX_HASH)
    expect(await screen.findByRole('link', { name: /3f659a42/ })).toHaveAttribute(
      'href',
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`,
    )
  })

  it('debounces lookups, aborts stale indexer requests, and serializes simulations', async () => {
    vi.useFakeTimers()
    const resolveSimulations: Array<() => void> = []
    simulateClaimFolder.mockImplementation(() => new Promise<void>((resolve) => resolveSimulations.push(resolve)))
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    const input = screen.getByLabelText(/Folder name/)

    fireEvent.change(input, { target: { value: 'jane' } })
    expect(screen.getByRole('status')).toHaveTextContent('Checking folder name availability')
    expect(screen.getByRole('button', { name: 'Claim folder' })).toBeDisabled()
    await act(async () => vi.advanceTimersByTimeAsync(299))
    expect(getFolderByName).not.toHaveBeenCalled()
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(getFolderByName).toHaveBeenCalledTimes(1)
    expect(simulateClaimFolder).toHaveBeenCalledTimes(1)

    const firstSignal = getFolderByName.mock.calls[0][1]
    fireEvent.change(input, { target: { value: 'john' } })
    await act(async () => vi.advanceTimersByTimeAsync(300))
    expect(firstSignal.aborted).toBe(true)
    expect(getFolderByName).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSimulations[0]()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(getFolderByName).toHaveBeenCalledTimes(2)
    expect(simulateClaimFolder).toHaveBeenCalledTimes(2)
    await act(async () => {
      resolveSimulations[1]()
      await Promise.resolve()
    })
  })

  it('reports an indexer match and links to the public folder page', async () => {
    getFolderByName.mockResolvedValue(buildFolder({ name: 'taken.folder' }))
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/Folder name/), 'taken')

    expect(await screen.findByText('This folder name is already claimed.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View public page' })).toHaveAttribute('href', '/p/taken.folder')
    expect(screen.getByRole('button', { name: 'Claim folder' })).toBeDisabled()
    expect(simulateClaimFolder).not.toHaveBeenCalled()
    expect(invoke).not.toHaveBeenCalled()
  })

  it('reports a taken name detected by simulation and surfaces other lookup errors', async () => {
    simulateClaimFolder.mockRejectedValueOnce(new TransactionError('Already taken.', { contractErrorCode: 3 }))
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/Folder name/), 'on-chain-taken')
    expect(await screen.findByText('This folder name is already claimed.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View public page' })).toHaveAttribute('href', '/p/on-chain-taken.folder')

    simulateClaimFolder.mockRejectedValueOnce(new Error('RPC unavailable'))
    await userEvent.clear(screen.getByLabelText(/Folder name/))
    await userEvent.type(screen.getByLabelText(/Folder name/), 'rpc-error')
    expect(await screen.findByText('Could not check availability: RPC unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Claim folder' })).toBeDisabled()
  })

  it('shows the mapped contract error', async () => {
    invoke.mockRejectedValue(new TransactionError('That folder name is already taken. Try another one.', { contractErrorCode: 3 }))
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/Folder name/), 'taken')
    expect(await screen.findByText('This folder name is available.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Claim folder' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That folder name is already taken.')
  })

  it('is disabled when the wallet is on the wrong network', () => {
    useWalletStore.setState({ network: 'PUBLIC', networkPassphrase: 'Public Global Stellar Network ; September 2015' })
    render(<ClaimFolderForm owner={OWNER} onClaimed={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Claim folder' })).toBeDisabled()
  })
})
