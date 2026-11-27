import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Badge, Card } from '@/components/ui'
import type { BadgeTone } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { env } from '@/config/env'
import { shortenKey } from '@/services'
import { stellarService } from '@/services/stellar/stellarService'
import type { ExplorePortfolio } from '@/types'
import { useInView } from '../hooks/useInView'

type Status = 'pending' | 'checking' | 'verified' | 'not_verified' | 'unavailable'

const badges: Record<Status | 'demo', { label: string; tone: BadgeTone }> = {
  pending: { label: 'Verification pending', tone: 'neutral' },
  checking: { label: 'Verifying…', tone: 'neutral' },
  verified: { label: 'Verified on Stellar', tone: 'success' },
  not_verified: { label: 'Not verified', tone: 'warning' },
  unavailable: { label: 'Verification unavailable', tone: 'warning' },
  demo: { label: 'Demo data, not verified', tone: 'warning' },
}

/** Calls `verify_portfolio` only once the card has scrolled into view, to limit RPC load. */
export const ExploreCard = ({ item }: { item: ExplorePortfolio }) => {
  const { ref, inView } = useInView<HTMLLIElement>()
  const [status, setStatus] = useState<Status>('pending')

  useEffect(() => {
    if (!inView || env.demoMode) return
    let cancelled = false
    setStatus('checking')
    stellarService
      .verifyPortfolio(item.owner)
      .then((ok) => !cancelled && setStatus(ok ? 'verified' : 'not_verified'))
      .catch(() => !cancelled && setStatus('unavailable'))
    return () => {
      cancelled = true
    }
  }, [inView, item.owner])

  const badge = badges[env.demoMode ? 'demo' : status]
  return (
    <li ref={ref}>
      <Card className="explore-card">
        <div>
          <h2 className="explore-card__title">
            <Link to={appRoutes.publicPortfolioFor(item.folderName)}>{item.folderName}</Link>
          </h2>
          <p className="explore-card__meta">
            Template {item.templateId} · {shortenKey(item.owner)} · updated{' '}
            <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString()}</time>
          </p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </Card>
    </li>
  )
}
