import { useState } from 'react'
import { Button } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { createProofBundle, downloadJson } from '../downloadProof'
import type { Verification } from '../hooks/usePublicPortfolio'
import { ShareDialog } from './ShareDialog'

interface PublicActionsProps {
  folderName: string
  /** Needed for the proof download; the button only appears for on-chain verified portfolios. */
  proof?: { cid: string; owner: string; verification: Verification }
}

/** Visitor-facing actions on a public portfolio (share/QR, print / save as PDF, proof download). */
export const PublicActions = ({ folderName, proof }: PublicActionsProps) => {
  const [shareOpen, setShareOpen] = useState(false)
  const [proofError, setProofError] = useState<string | null>(null)
  const canonicalUrl = `${window.location.origin}${appRoutes.publicPortfolioFor(folderName)}`

  const downloadProof = async () => {
    if (!proof || proof.verification.status !== 'verified') return
    setProofError(null)
    try {
      const bundle = await createProofBundle({ cid: proof.cid, folder: folderName, onChain: proof.verification.onChain, owner: proof.owner })
      downloadJson(bundle, `${folderName}.proof.json`)
    } catch (error) {
      setProofError(error instanceof Error ? error.message : 'Could not create the proof bundle.')
    }
  }

  return (
    <div className="public-actions cluster">
      <Button type="button" variant="secondary" onClick={() => setShareOpen(true)}>
        Share / QR code
      </Button>
      <Button type="button" variant="secondary" onClick={() => window.print()}>
        Print / Save PDF
      </Button>
      {proof?.verification.status === 'verified' ? (
        <Button type="button" variant="secondary" onClick={() => void downloadProof()}>
          Download proof
        </Button>
      ) : null}
      {proofError ? (
        <span className="muted" role="alert">
          {proofError}
        </span>
      ) : null}
      {shareOpen ? <ShareDialog title={folderName} url={canonicalUrl} onClose={() => setShareOpen(false)} /> : null}
    </div>
  )
}
