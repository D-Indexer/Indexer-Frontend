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

/** Live region describing an in-flight, successful or failed transaction, with a stellar.expert link. */
export const TxStatus = ({ error, hash, stage, successMessage, prepared }: TxStatusProps) => {
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
      {prepared ? <details><summary>Show technical details</summary><p><strong>Method:</strong> {prepared.method}</p><p><strong>Transaction hash:</strong> <code>{prepared.hash}</code></p><label>Prepared XDR<textarea readOnly value={prepared.xdr} aria-label="Prepared transaction XDR" /></label><p><ExternalLink href="https://laboratory.stellar.org/#xdr-viewer">Open Stellar Laboratory XDR viewer</ExternalLink></p></details> : null}
    </div>
  )
}
