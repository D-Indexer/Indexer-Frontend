import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TESTNET_PASSPHRASE } from '@/services/stellar/network'
import { useWalletAddress, useWalletStatus, useWalletStore } from './walletStore'

const ADDRESS = 'GAPAMTTVHB7RZ5DQHEINZN3GQYRCXXWNCQNQSY5YAU6RKQUYX2QJT2CM'
const snapshot = { address: ADDRESS, network: 'TESTNET', networkPassphrase: TESTNET_PASSPHRASE }

describe('walletStore', () => {
  beforeEach(() => {
    useWalletStore.setState({ ...snapshot, status: 'connected', error: null })
  })

  it('does not re-render subscribers when a watcher poll reports an unchanged wallet', () => {
    let renders = 0
    const Probe = () => {
      renders += 1
      useWalletAddress()
      useWalletStatus()
      return null
    }
    render(<Probe />)
    const initial = renders

    act(() => {
      useWalletStore.getState().update({ ...snapshot })
      useWalletStore.getState().update({ ...snapshot })
    })
    expect(renders).toBe(initial)

    act(() => useWalletStore.getState().update({ ...snapshot, address: 'GOTHER' }))
    expect(renders).toBe(initial + 1)
  })

  it('keeps the same state object when the snapshot is unchanged', () => {
    const before = useWalletStore.getState()
    useWalletStore.getState().update({ ...snapshot })
    expect(useWalletStore.getState()).toBe(before)
  })
})
