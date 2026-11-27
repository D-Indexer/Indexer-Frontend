import type { AnchorHTMLAttributes, PropsWithChildren } from 'react'
import { asciiHostname } from '@/utils/format'

/** Link that opens in a new tab and says so to screen readers. */
export const ExternalLink = ({ children, href, ...props }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => {
  const ascii = href ? asciiHostname(href) : null
  return (
    <a className="external-link" target="_blank" rel="noreferrer" href={href} {...props}>
      <bdi>{children}</bdi>
      {ascii ? <span className="external-link__host mono small"> ({ascii})</span> : null}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
