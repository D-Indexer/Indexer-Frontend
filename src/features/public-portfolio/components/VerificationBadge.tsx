import { ExternalLink } from '@/components/ui'
import { env } from '@/config/env'
import { explorerLinks } from '@/services'
import type { Verification } from '../hooks/usePublicPortfolio'

interface VerificationBadgeProps {
  owner: string
  verification: Verification
}

export const VerificationBadge = ({ owner, verification }: VerificationBadgeProps) => {
  const links = (
    <p className="verification__links">
      <ExternalLink href={explorerLinks.account(owner)}>Owner&apos;s transactions</ExternalLink>
      {env.folderContractId ? (
        <>
          {' · '}
          <ExternalLink href={explorerLinks.contract(env.folderContractId)}>Folder contract</ExternalLink>
        </>
      ) : null}
    </p>
  )

  switch (verification.status) {
    case 'verified':
      return (
        <aside className="verification verification--verified" aria-label="Verification">
          <p className="verification__title">
            <span aria-hidden="true">✓</span> Verified on Stellar
          </p>
          <p>
            <code>verify_portfolio</code> returned true for this owner on testnet, and the content below was loaded by the CID stored
            on-chain.
          </p>
          {links}
        </aside>
      )
    case 'not_minted':
      return (
        <aside className="verification verification--warning" aria-label="Verification">
          <p className="verification__title">Not verified</p>
          <p>The contract has no portfolio NFT for this owner yet.</p>
          {links}
        </aside>
      )
    case 'unavailable':
      return (
        <aside className="verification verification--warning" aria-label="Verification">
          <p className="verification__title">Verification unavailable</p>
          <p>The contract could not be reached ({verification.reason}). The content below comes from the indexer and is unverified.</p>
          {links}
        </aside>
      )
    case 'demo':
      return (
        <aside className="verification verification--warning" aria-label="Verification">
          <p className="verification__title">Demo data, not verified</p>
          <p>Demo mode does not query the contract.</p>
        </aside>
      )
  }
}
