import { useEffect, useRef } from 'react'
import { Identifier } from '@/components/ui'
import { explorerLinks } from '@/services'
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

/** Contract identity shown before signing: identicon, shortened contract ID and called method. */
const ContractIdentity = ({ method }: { method: string }) => {
  const contractId = env.folderContractId
  return (
    <div className="contract-identity">
      <ContractIdenticon contractId={contractId} />
      <div>
        <p className="small">
          Contract <span className="mono">{shortenKey(contractId, 6)}</span> · method{' '}
          <span className="mono">{method}</span>
        </p>
        <p className="small">
          <ExternalLink href={explorerLinks.contract(contractId)}>View contract on stellar.expert</ExternalLink>{' '}
          · <ExternalLink href={CONTRACT_VERIFICATION_DOCS_URL}>How to verify a contract ID</ExternalLink>
        </p>
      </div>
    </div>
  )
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
