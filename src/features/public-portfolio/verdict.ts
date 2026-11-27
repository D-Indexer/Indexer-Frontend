import type { PublicPortfolio, Verification } from './hooks/usePublicPortfolio'

/** The verdict the public page shows, in a form both the UI and the CLI can consume. */
export interface PortfolioVerdict {
  /** `verified` only when the contract confirmed the portfolio and its content loaded. */
  verified: boolean
  status: Verification['status']
  /** One-line summary, identical to the badge title on the public page. */
  title: string
  /** Longer explanation, identical to the badge body on the public page. */
  detail: string
}

export const describeVerification = (verification: Verification): { title: string; detail: string } => {
  switch (verification.status) {
    case 'verified':
      return {
        title: 'Verified on Stellar',
        detail:
          'verify_portfolio returned true for this owner on testnet, and the content below was loaded by the CID stored on-chain.',
      }
    case 'not_minted':
      return { title: 'Not verified', detail: 'The contract has no portfolio NFT for this owner yet.' }
    case 'unavailable':
      return {
        title: 'Verification unavailable',
        detail: `The contract could not be reached (${verification.reason}). The content below comes from the indexer and is unverified.`,
      }
    case 'demo':
      return { title: 'Demo data, not verified', detail: 'Demo mode does not query the contract.' }
  }
}

export const portfolioVerdict = (portfolio: PublicPortfolio): PortfolioVerdict => {
  const { title, detail } = describeVerification(portfolio.verification)
  return {
    verified: portfolio.verification.status === 'verified' && portfolio.content !== null,
    status: portfolio.verification.status,
    title,
    detail,
  }
}