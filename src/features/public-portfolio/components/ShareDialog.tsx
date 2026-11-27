import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { drawQrToCanvas, encodeQr, qrToSvg } from '@/utils/qr'

interface ShareDialogProps {
  onClose: () => void
  title: string
  url: string
}

const FOCUSABLE = 'button, [href], input, [tabindex]:not([tabindex="-1"])'

const download = (blob: Blob, filename: string) => {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
  URL.revokeObjectURL(href)
}

/** Modal with a QR code for the canonical public URL. Everything is generated locally. */
export const ShareDialog = ({ onClose, title, url }: ShareDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('')
  const matrix = useMemo(() => encodeQr(url), [url])
  const svg = useMemo(() => qrToSvg(matrix, `QR code for ${url}`), [matrix, url])
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => previous?.focus()
  }, [])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const downloadSvg = () => download(new Blob([svg], { type: 'image/svg+xml' }), 'folder-qr.svg')

  const downloadPng = () => {
    const canvas = document.createElement('canvas')
    try {
      drawQrToCanvas(matrix, canvas, 10)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create the PNG.')
      return
    }
    canvas.toBlob((blob) => (blob ? download(blob, 'folder-qr.png') : setStatus('Could not create the PNG.')), 'image/png')
  }

  const share = async () => {
    try {
      await navigator.share({ title, url })
    } catch {
      // The user dismissed the native sheet; nothing to report.
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('Link copied')
    } catch {
      setStatus('Could not copy the link')
    }
  }

  return (
    <div className="share-dialog__backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="share-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        onKeyDown={onKeyDown}
      >
        <h2 id="share-dialog-title">Share {title}</h2>
        <div className="share-dialog__qr" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mono share-dialog__url">{url}</p>
        <div className="cluster">
          <Button type="button" variant="secondary" onClick={downloadSvg}>
            Download SVG
          </Button>
          <Button type="button" variant="secondary" onClick={downloadPng}>
            Download PNG
          </Button>
          <Button type="button" variant="secondary" onClick={() => void copy()}>
            Copy link
          </Button>
          {canShare ? (
            <Button type="button" variant="secondary" onClick={() => void share()}>
              Share via…
            </Button>
          ) : null}
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="muted" role="status">
          {status}
        </p>
      </div>
    </div>
  )
}
