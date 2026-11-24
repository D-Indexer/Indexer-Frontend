import { useState } from 'react'
import { ExternalLink } from '@/components/ui'
import { explorerLinks } from '@/services'
import type { Verification, VerificationFacts } from '../hooks/usePublicPortfolio'

interface VerificationDetailsProps {
  facts: VerificationFacts
  status: Verification['status']
}

/** Shell commands that reproduce the checks behind the badge without trusting this site. */
export const buildVerificationCommands = ({ contractId, network, owner, onChainCid }: VerificationFacts) => {
  const commands = [
    `stellar contract invoke --id ${contractId} --network ${network} -- get_portfolio --owner ${owner}`,
  ]
  if (onChainCid) {
    commands.push(`ipfs cat ${onChainCid} | sha256sum`, `ipfs cid format -v 1 -b base32 ${onChainCid}`)
  }
  return commands
}

const CopyButton = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard
      ?.writeText(value)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
  }
  return (
    <button type="button" className="btn btn--ghost btn--sm" aria-label={`Copy ${label}`} onClick={copy}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const Fact = ({ label, value }: { label: string; value: string | null }) => (
  <>
    <dt>{label}</dt>
    <dd>
      {value ? (
        <>
          <code>{value}</code>
          <CopyButton label={label} value={value} />
        </>
      ) : (
        'Not available'
      )}
    </dd>
  </>
)

const hashResult = (status: Verification['status'], facts: VerificationFacts) => {
  if (status === 'verified') return facts.contentLoaded ? 'Content fetched by the on-chain CID' : 'Content could not be fetched'
  if (status === 'not_minted') return 'Nothing to check: no portfolio minted'
  return 'Not checked'
}

export const VerificationDetails = ({ facts, status }: VerificationDetailsProps) => {
  if (status === 'demo') return null
  const commands = buildVerificationCommands(facts)
  const minted = facts.mintedAt ? new Date(facts.mintedAt * 1000).toISOString() : null

  return (
    <details className="verification-details">
      <summary>How this was verified</summary>
      <dl>
        <Fact label="Contract ID" value={facts.contractId || null} />
        <Fact label="Network" value={facts.network} />
        <Fact label="Owner" value={facts.owner} />
        <Fact label="On-chain CID" value={facts.onChainCid} />
        <Fact label="Template ID" value={facts.templateId === null ? null : String(facts.templateId)} />
        <Fact label="Minted at" value={minted} />
        <dt>Hash check</dt>
        <dd>{hashResult(status, facts)}</dd>
      </dl>
      <p>Reproduce it yourself:</p>
      {commands.map((command) => (
        <div key={command}>
          <pre>
            <code>{command}</code>
          </pre>
          <CopyButton label="command" value={command} />
        </div>
      ))}
      <p className="verification__links">
        {facts.contractId ? (
          <>
            <ExternalLink href={explorerLinks.contract(facts.contractId)}>Contract on stellar.expert</ExternalLink>
            {' · '}
          </>
        ) : null}
        <ExternalLink href={explorerLinks.account(facts.owner)}>Owner on stellar.expert</ExternalLink>
      </p>
    </details>
  )
}
