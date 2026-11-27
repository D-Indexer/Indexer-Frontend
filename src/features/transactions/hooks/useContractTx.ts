import { useCallback, useRef, useState } from 'react'
import { freighterWallet, toApiError } from '@/services'
import { stellarService, TransactionError, type FolderWrite, type TxResult, type TxStage } from '@/services/stellar/stellarService'
import { useWalletStore } from '@/store'

export type FlowStage = 'idle' | 'uploading' | TxStage | 'done' | 'failed'

export interface ContractTxState {
  error: string | null
  /** Hash of a submitted transaction, also set when it failed or is still pending. */
  hash: string | null
  stage: FlowStage
  prepared: PreparedTransactionDetails | null
}

const initialState: ContractTxState = { error: null, hash: null, stage: 'idle', prepared: null }

/** Maps a confirmed contract write to its typed domain event. */
const emitConfirmedWrite = (owner: string, write: FolderWrite, result: TxResult) => {
  const base = { hash: result.hash, ledger: result.ledger, owner }
  switch (write.method) {
    case 'claim_folder':
      emit('folder.claimed', { ...base, folderName: write.folderName })
      break
    case 'mint_portfolio':
      emit('portfolio.minted', { ...base, templateId: write.templateId, ipfsCid: write.ipfsCid })
      break
    case 'update_portfolio':
      emit('portfolio.updated', { ...base, ipfsCid: write.ipfsCid })
      break
  }
}

/**
 * Runs one Folder contract write with Freighter as signer. `prepare` can do async work first
 * (e.g. the IPFS upload) and returns the write to send.
 * Serializes writes per owner across browser tabs using the Web Locks API (`navigator.locks`).
 */
export const useContractTx = () => {
  const [state, setState] = useState<ContractTxState>(initialState)
  const running = useRef(false)
  const { freighterWallet, stellarService } = useServices()
  const addActivity = useActivityStore((s) => s.addActivity)
  const updateActivity = useActivityStore((s) => s.updateActivity)

  const run = useCallback(async (owner: string, prepare: (setUploading: () => void) => Promise<FolderWrite>): Promise<TxResult | null> => {
    if (running.current) return null
    running.current = true
    const initialWallet = useWalletStore.getState()
    const controller = new AbortController()
    const unsubscribe = useWalletStore.subscribe((current) => {
      if (current.address !== initialWallet.address || current.networkPassphrase !== initialWallet.networkPassphrase) controller.abort()
    })
    setState({ ...initialState, stage: 'preparing' })
    try {
      const write = await prepare(() => setState((current) => ({ ...current, stage: 'uploading' })))
      activityId = addActivity({
        address: owner,
        method: write.method,
        status: 'pending',
        hash: null,
      })

      const result = await stellarService.invoke(owner, write, freighterWallet.signTransaction, (stage) =>
        setState((current) => ({ ...current, stage })),
        controller.signal,
      )
      setState({ error: null, hash: result.hash, stage: 'done' })
      emitConfirmedWrite(owner, write, result)
      return result
    } catch (error) {
      const hash = error instanceof TransactionError ? (error.options.hash ?? null) : null
      const message = toApiError(error).message
      setState({ error: message, hash, stage: 'failed' })
      if (activityId) {
        updateActivity(activityId, owner, { status: 'failed', hash, error: message })
      }
      return null
    } finally {
      unsubscribe()
      running.current = false
    }

    // Fallback when Web Locks API is not available
    return execute()
  }, [])

  const reset = useCallback(() => setState(initialState), [])

  const busy = state.stage !== 'idle' && state.stage !== 'done' && state.stage !== 'failed'
  return { ...state, busy, reset, run }
}
