import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from '@/components/ui'
import { explorerLinks, shortenKey } from '@/services'
import type { ContractTxState, FlowStage } from '../hooks/useContractTx'
import { TxStepper, txSteps } from './TxStepper'

const stageLabels: Partial<Record<FlowStage, string>> = {
  preparing: 'Building and simulating the transaction…',
  uploading: 'Uploading portfolio content to IPFS through the backend…',
  signing: 'Waiting for your signature in Freighter…',
  submitting: 'Submitting to Stellar testnet…',
  confirming: 'Waiting for the transaction to be confirmed…',
}

const stepLabelForStage = (stage: FlowStage): string | null => {
  if (stage === 'done') return 'Transaction confirmed'
  if (stage === 'failed') return 'Transaction failed'
  return txSteps.find((step) => step.stages.includes(stage))?.label ?? null
}

interface TxStatusProps extends ContractTxState {
  successMessage: string
}

/** Live region describing an in-flight, successful or failed transaction, with a stellar.expert link. */
export const TxStatus = ({ error, hash, stage, successMessage }: TxStatusProps) => {
  const [announcement, setAnnouncement] = useState('')
  const lastAnnounced = useRef<FlowStage | null>(null)

  useEffect(() => {
    if (stage === 'idle' || stage === lastAnnounced.current) return
    lastAnnounced.current = stage
    const label = stepLabelForStage(stage)
    if (label) setAnnouncement(label)
  }, [stage])

  const hashLink = hash ? (
    <p>
      Transaction:{' '}
      <ExternalLink className="mono" href={explorerLinks.transaction(hash)}>
        {shortenKey(hash, 8)}
      </ExternalLink>{' '}
      on stellar.expert
    </p>
  ) : null

  return (
    <div className="tx-status">
      {stage !== 'idle' ? <TxStepper stage={stage} /> : null}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {stageLabels[stage] ? (
        <div className="notice">
          <span className="loading-state__spinner" aria-hidden="true" />
          <p>{stageLabels[stage]}</p>
        </div>
      ) : null}
      {stage === 'done' ? (
        <div className="notice notice--success notice--stack">
          <p>{successMessage}</p>
          {hashLink}
        </div>
      ) : null}
      {stage === 'failed' && error ? (
        <div className="notice notice--danger notice--stack" role="alert">
          <p>{error}</p>
          {hashLink}
        </div>
      ) : null}
    </div>
  )
}
