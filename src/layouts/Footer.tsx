import { env } from '@/config/env'

export const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <span>Folder Frontend</span>
        <span>{env.stellarNetwork} · contract {env.folderContractId || 'not configured'}</span>
      </div>
    </footer>
  )
}
