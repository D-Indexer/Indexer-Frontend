import { useEffect, useRef } from 'react'
import { Identifier } from '@/components/ui'
import { explorerLinks } from '@/services'
import type { ContractTxState, FlowStage } from '../hooks/useContractTx'

const stageLabels: Partial<Record<FlowStage, string>> = {
  preparing: 'Building and simulating the transaction…',
  uploading: 'Uploading portfolio content to IPFS through the backend…',
  signing: 'Waiting for your signature in Freighter…',
  submitting: 'Submitting to Stellar testnet…',
  confirming: 'Waiting for the transaction to be confirmed…',
}

interface TxStatusProps extends ContractTxState {
  successMessage: string
}

/**
 * Live region describing an in-flight, successful or failed transaction, with a stellar.expert link.
 *
 * Screen-reader behaviour: the region is rendered once and only its text changes, so each stage is
 * announced exactly once (no duplicate polite/assertive announcements). When the flow ends, focus
 * moves to the outcome so it is read in context and the next Tab continues from there.
 */
export const TxStatus = ({ error, hash, stage, successMessage }: TxStatusProps) => {
  const outcomeRef = useRef<HTMLDivElement>(null)
  const previousStage = useRef<FlowStage>(stage)
  const finished = stage === 'done' || stage === 'failed'

  useEffect(() => {
    const wasFinished = previousStage.current === 'done' || previousStage.current === 'failed'
    previousStage.current = stage
    if (finished && !wasFinished) outcomeRef.current?.focus()
  }, [finished, stage])

  const hashLink = hash ? (
    <p>
      Transaction: <Identifier label="Transaction hash" value={hash} href={explorerLinks.transaction(hash)} visible={8} /> on
      stellar.expert
    </p>
  ) : null

  return (
    <div className="tx-status" aria-live="polite" aria-atomic="true">
      {stageLabels[stage] ? (
        <div className="notice">
          <span className="loading-state__spinner" aria-hidden="true" />
          <p>{stageLabels[stage]}</p>
        </div>
      ) : null}
      {stage === 'done' ? (
        <div className="notice notice--success notice--stack" ref={outcomeRef} tabIndex={-1}>
          <p>{successMessage}</p>
          {hashLink}
        </div>
      ) : null}
      {stage === 'failed' && error ? (
        <div className="notice notice--danger notice--stack" ref={outcomeRef} tabIndex={-1}>
          <p>{error}</p>
          {hashLink}
        </div>
      ) : null}
    </div>
  )
}
