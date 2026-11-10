import { ExternalLink } from '@/components/ui'
import { env } from '@/config/env'
import { explorerLinks, shortenKey } from '@/services'

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <span>Folder · MIT licensed</span>
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
