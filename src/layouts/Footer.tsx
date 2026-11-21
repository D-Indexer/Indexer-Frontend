import { Identifier } from '@/components/ui'
import { env } from '@/config/env'
import { explorerLinks } from '@/services'

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
              <Identifier label="Folder contract" value={env.folderContractId} href={explorerLinks.contract(env.folderContractId)} visible={6} />
            </>
          ) : null}
        </span>
      </div>
    </footer>
  )
}
