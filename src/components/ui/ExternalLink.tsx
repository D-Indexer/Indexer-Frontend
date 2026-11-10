import type { AnchorHTMLAttributes, PropsWithChildren } from 'react'

/** Link that opens in a new tab and says so to screen readers. */
export const ExternalLink = ({ children, ...props }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
  <a className="external-link" target="_blank" rel="noreferrer" {...props}>
    {children}
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
)
