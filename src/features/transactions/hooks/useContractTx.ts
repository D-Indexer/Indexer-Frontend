import { useCallback, useRef, useState } from 'react'
import { freighterWallet, toApiError } from '@/services'
import { stellarService, TransactionError, type FolderWrite, type TxResult, type TxStage } from '@/services/stellar/stellarService'

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
 */
export const useContractTx = () => {
  const [state, setState] = useState<ContractTxState>(initialState)
  const running = useRef(false)

  const run = useCallback(async (owner: string, prepare: (setUploading: () => void) => Promise<FolderWrite>): Promise<TxResult | null> => {
    if (running.current) return null
    running.current = true
    setState({ ...initialState, stage: 'preparing' })
    try {
      const write = await prepare(() => setState((current) => ({ ...current, stage: 'uploading' })))
      const result = await stellarService.invoke(owner, write, freighterWallet.signTransaction, (stage) =>
        setState((current) => ({ ...current, stage })),
      )
      setState({ error: null, hash: result.hash, stage: 'done' })
      return result
    } catch (error) {
      const hash = error instanceof TransactionError ? (error.options.hash ?? null) : null
      setState({ error: toApiError(error).message, hash, stage: 'failed' })
      return null
    } finally {
      running.current = false
    }
  }, [])

  const reset = useCallback(() => setState(initialState), [])

  const busy = state.stage !== 'idle' && state.stage !== 'done' && state.stage !== 'failed'
  return { ...state, busy, reset, run }
}
