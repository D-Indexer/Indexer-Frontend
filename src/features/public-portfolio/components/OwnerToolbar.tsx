import { useState } from 'react'
import { Button, ExternalLink, LinkButton } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { explorerLinks } from '@/services'
import { useWalletStore } from '@/store'

interface OwnerToolbarProps {
  owner: string
}

/** Owner-only shortcuts. Renders nothing unless the connected wallet is exactly the folder owner. */
export const OwnerToolbar = ({ owner }: OwnerToolbarProps) => {
  const address = useWalletStore((state) => state.address)
  const [copied, setCopied] = useState(false)

  if (!address || address !== owner) return null

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <nav className="owner-toolbar" aria-label="Owner controls">
      <p className="owner-toolbar__title">This is your portfolio</p>
      <LinkButton to={appRoutes.dashboard} variant="secondary">
        Edit portfolio
      </LinkButton>
      <Button type="button" variant="secondary" onClick={() => void share()}>
        {copied ? 'Link copied' : 'Share'}
      </Button>
      <ExternalLink href={explorerLinks.account(owner)}>View on explorer</ExternalLink>
    </nav>
  )
}
