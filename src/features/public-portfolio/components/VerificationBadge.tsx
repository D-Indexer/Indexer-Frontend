import { ExternalLink } from '@/components/ui'
import { env } from '@/config/env'
import { explorerLinks } from '@/services'
import type { Verification } from '../hooks/usePublicPortfolio'
import { describeVerification } from '../verdict'

interface VerificationBadgeProps {
  owner: string
  verification: Verification
}

export const VerificationBadge = ({ owner, verification }: VerificationBadgeProps) => {
  const { title, detail } = describeVerification(verification)
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
            <span aria-hidden="true">✓</span> {title}
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
          <p className="verification__title">{title}</p>
          <p>{detail}</p>
          {links}
        </aside>
      )
    case 'unavailable':
      return (
        <aside className="verification verification--warning" aria-label="Verification">
          <p className="verification__title">{title}</p>
          <p>{detail}</p>
          {links}
        </aside>
      )
    case 'demo':
      return (
        <aside className="verification verification--warning" aria-label="Verification">
          <p className="verification__title">{title}</p>
          <p>{detail}</p>
        </aside>
      )
  }
}
