import { ExternalLink } from '@/components/ui'
import { buildCommit, env } from '@/config/env'
import { explorerLinks, shortenKey } from '@/services'

const REPO_URL = 'https://github.com/D-Indexer/Indexer-Frontend'

/** Short commit shown in the footer; `unknown` when built outside git. */
export const shortBuildCommit = (commit: string) => (commit === 'unknown' ? commit : commit.slice(0, 7))

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <span>
          Folder · MIT licensed
          {' · build '}
          <ExternalLink className="mono" href={`${REPO_URL}/commit/${buildCommit}`} title={buildCommit}>
            {shortBuildCommit(buildCommit)}
          </ExternalLink>
          {' · '}
          <ExternalLink href={`${REPO_URL}/attestations`}>build provenance</ExternalLink>
        </span>
        <span>
          Stellar {env.stellarNetwork}
          {env.folderContractId ? (
            <>
              {' · contract '}
              <ExternalLink className="mono" href={explorerLinks.contract(env.folderContractId)}>
                {shortenKey(env.folderContractId, 6)}
              </ExternalLink>
            </>
          ) : null}
        </span>
      </div>
    </footer>
  )
}
