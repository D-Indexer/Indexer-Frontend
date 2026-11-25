import { useState } from 'react'
import { Button } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { ShareDialog } from './ShareDialog'

interface PublicActionsProps {
  folderName: string
}

/** Visitor-facing actions on a public portfolio (share/QR, print / save as PDF). */
export const PublicActions = ({ folderName }: PublicActionsProps) => {
  const [shareOpen, setShareOpen] = useState(false)
  const canonicalUrl = `${window.location.origin}${appRoutes.publicPortfolioFor(folderName)}`

  return (
    <div className="public-actions cluster">
      <Button type="button" variant="secondary" onClick={() => setShareOpen(true)}>
        Share / QR code
      </Button>
      <Button type="button" variant="secondary" onClick={() => window.print()}>
        Print / Save PDF
      </Button>
      {shareOpen ? <ShareDialog title={folderName} url={canonicalUrl} onClose={() => setShareOpen(false)} /> : null}
    </div>
  )
}
