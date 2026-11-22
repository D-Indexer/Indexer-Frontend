import { useCallback, useRef, useState } from 'react'
import { toApiError, useServices } from '@/services'
import { TransactionError, type FolderWrite, type TxResult, type TxStage } from '@/services/stellar/stellarService'
import { useActivityStore } from '../activityStore'

export type FlowStage = 'idle' | 'uploading' | TxStage | 'done' | 'failed'

export interface ContractTxState {
  error: string | null
  /** Hash of a submitted transaction, also set when it failed or is still pending. */
  hash: string | null
  stage: FlowStage
}

const initialState: ContractTxState = { error: null, hash: null, stage: 'idle' }

/**
 * Runs one Folder contract write with Freighter as signer. `prepare` can do async work first
 * (e.g. the IPFS upload) and returns the write to send.
 * Uses injected services from context and records activity in activityStore.
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
    let activityId: string | null = null

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
      )
      setState({ error: null, hash: result.hash, stage: 'done' })
      if (activityId) {
        updateActivity(activityId, owner, { status: 'success', hash: result.hash })
      }
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
      running.current = false
    }
  }, [addActivity, updateActivity, stellarService, freighterWallet])

  const reset = useCallback(() => setState(initialState), [])

  const busy = state.stage !== 'idle' && state.stage !== 'done' && state.stage !== 'failed'
  return { ...state, busy, reset, run }
}
