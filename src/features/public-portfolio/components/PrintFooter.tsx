import { useMemo } from 'react'
import { env } from '@/config/env'
import { encodeQr, qrToSvg } from '@/utils/qr'

interface PrintFooterProps {
  checkedAt: Date
  cid: string
  url: string
  verified: boolean
}

/** Footer that only appears in print output: what was verified, against what, and a QR to the live page. */
export const PrintFooter = ({ checkedAt, cid, url, verified }: PrintFooterProps) => {
  const svg = useMemo(() => qrToSvg(encodeQr(url), `QR code for ${url}`), [url])
  const date = checkedAt.toISOString().slice(0, 10)

  return (
    <footer className="print-only print-footer" aria-label="Verification summary">
      <div>
        <p>
          <strong>{verified ? 'Verified on Stellar' : 'Not verified on-chain'}:</strong>{' '}
          {env.folderContractId ? `contract ${env.folderContractId}, ` : ''}CID {cid}, checked {date}
        </p>
        <p>Live page: {url}</p>
      </div>
      <div className="print-footer__qr" dangerouslySetInnerHTML={{ __html: svg }} />
    </footer>
  )
}
