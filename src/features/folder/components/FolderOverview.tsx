import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AsyncContent, ExternalLink } from '@/components/ui'
import { PortfolioForm } from '@/features/portfolio'
import { useFolder, usePortfolio } from '@/hooks'
import { explorerLinks } from '@/services'
import type { ApiError } from '@/types'
import { ClaimFolderForm } from './ClaimFolderForm'
import { FolderSummary } from './FolderSummary'

interface FolderOverviewProps {
  address: string
}

/** Indexer lag after a confirmed transaction is usually a few seconds; re-read a few times. */
const REFRESH_DELAYS_MS = [2_000, 6_000, 15_000]

/** The connected wallet's folder and portfolio, plus the next action: claim, mint or update. */
export const FolderOverview = ({ address }: FolderOverviewProps) => {
  const [searchParams] = useSearchParams()
  const folder = useFolder(address)
  const portfolio = usePortfolio(address)
  const [lastTx, setLastTx] = useState<{ hash: string; label: string } | null>(null)
  const timers = useRef<number[]>([])
  const error: ApiError | null = folder.error ?? portfolio.error
  const { refetch: refetchFolder } = folder
  const { refetch: refetchPortfolio } = portfolio

  const refresh = useCallback(() => {
    void refetchFolder()
    void refetchPortfolio()
  }, [refetchFolder, refetchPortfolio])

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  const onConfirmed = (label: string) => (hash: string) => {
    setLastTx({ hash, label })
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = REFRESH_DELAYS_MS.map((delay) => window.setTimeout(refresh, delay))
  }

  return (
    <section className="stack" aria-label="Your folder">
      {lastTx ? (
        <div className="notice notice--success notice--stack" role="status">
          <p>{lastTx.label} confirmed on Stellar testnet.</p>
          <p>
            <ExternalLink className="mono" href={explorerLinks.transaction(lastTx.hash)}>
              View transaction {lastTx.hash.slice(0, 10)}… on stellar.expert
            </ExternalLink>
          </p>
        </div>
      ) : null}
      <AsyncContent
        data={{ folder: folder.data, portfolio: portfolio.data }}
        error={error}
        loading={(folder.loading && folder.data === null) || (portfolio.loading && portfolio.data === null)}
        loadingLabel="Loading your folder…"
        minHeight="20rem"
        onRetry={refresh}
      >
        {(state) =>
          state.folder ? (
            <div className="stack">
              <FolderSummary folder={state.folder} portfolio={state.portfolio} />
              <PortfolioForm
                key={state.portfolio?.ipfsCid ?? 'new'}
                owner={address}
                folder={state.folder}
                portfolio={state.portfolio}
                initialTemplateId={searchParams.get('template')}
                onPublished={onConfirmed(state.portfolio ? 'Portfolio update' : 'Portfolio mint')}
              />
            </div>
          ) : (
            <div className="stack">
              <p className="muted">This address has not claimed a folder yet. Claim one to mint your portfolio.</p>
              <ClaimFolderForm owner={address} onClaimed={onConfirmed('Folder claim')} />
            </div>
          )
        }
      </AsyncContent>
    </section>
  )
}
