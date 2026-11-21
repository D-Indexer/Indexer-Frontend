import { useEffect, useRef, useState } from 'react'
import { classNames } from '@/utils/classNames'

/** `GABC…WXYZ` style middle truncation for addresses, contracts, CIDs and hashes. */
export const truncateIdentifier = (value: string, visible = 4) =>
  value.length <= visible * 2 + 1 ? value : `${value.slice(0, visible)}…${value.slice(-visible)}`

const copyToClipboard = async (value: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  if (typeof document === 'undefined') throw new Error('Clipboard unavailable')
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) throw new Error('Clipboard unavailable')
}

interface IdentifierProps {
  /** Full, untruncated identifier. */
  value: string
  /** Optional explorer link for the full value. */
  href?: string
  /** Characters kept at each end before truncation. */
  visible?: number
  /** Accessible name for the identifier, e.g. "Wallet address". */
  label?: string
  className?: string
}

/**
 * Long identifier (address, contract, CID, hash) shown middle-truncated, with the full value
 * exposed to assistive tech, a copy button with a polite announcement, and an optional explorer link.
 */
export const Identifier = ({ value, href, visible = 4, label, className }: IdentifierProps) => {
  const [announcement, setAnnouncement] = useState('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const announce = (message: string) => {
    window.clearTimeout(timer.current)
    setAnnouncement(message)
    timer.current = window.setTimeout(() => setAnnouncement(''), 4_000)
  }

  const onCopy = async () => {
    try {
      await copyToClipboard(value)
      announce('Copied to clipboard')
    } catch {
      announce('Copy failed. Select the full value and copy it manually.')
    }
  }

  const text = (
    <span className="identifier__value mono" aria-label={label ? `${label}: ${value}` : value}>
      <span aria-hidden="true">{truncateIdentifier(value, visible)}</span>
    </span>
  )

  return (
    <span className={classNames('identifier', className)}>
      {href ? (
        <a className="identifier__link" href={href} target="_blank" rel="noreferrer" title={value}>
          {text}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <span title={value}>{text}</span>
      )}
      <button type="button" className="identifier__copy" onClick={() => void onCopy()} aria-label={`Copy ${label ?? 'identifier'} ${value}`}>
        Copy
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </span>
  )
}
