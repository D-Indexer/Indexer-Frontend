import { ExternalLink } from '@/components/ui'
import { env } from '@/config/env'
import { explorerLinks, shortenKey } from '@/services'
import { ContractIdenticon } from './ContractIdenticon'
import type { ContractTxState, FlowStage } from '../hooks/useContractTx'

const stageLabels: Partial<Record<FlowStage, string>> = {
  preparing: 'Building and simulating the transaction…',
  uploading: 'Uploading portfolio content to IPFS through the backend…',
  signing: 'Waiting for your signature in Freighter…',
  submitting: 'Submitting to Stellar testnet…',
  confirming: 'Waiting for the transaction to be confirmed…',
}

/** Where the contract ID verification steps are documented. */
export const CONTRACT_VERIFICATION_DOCS_URL = 'https://github.com/D-Indexer/Indexer-Frontend/blob/main/docs/architecture.md#verifying-a-contract-id-before-signing'

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
export const TxStatus = ({ error, hash, method, stage, successMessage }: TxStatusProps) => {
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
    <div className="tx-status" aria-live="polite">
      {stage === 'signing' && method ? (
        <div className="notice notice--stack" role="status">
          <p>Check that you are signing this call before approving it in Freighter:</p>
          <ContractIdentity method={method} />
        </div>
      ) : null}
      {stageLabels[stage] ? (
        <div className="notice" role="status">
          <span className="loading-state__spinner" aria-hidden="true" />
          <p>{stageLabels[stage]}</p>
        </div>
      ) : null}
      {stage === 'done' ? (
        <div className="notice notice--success notice--stack" role="status">
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
