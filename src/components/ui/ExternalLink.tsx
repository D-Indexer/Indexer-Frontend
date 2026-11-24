import type { AnchorHTMLAttributes, PropsWithChildren } from 'react'

/** Link that announces when it opens in a new tab to screen readers. */
export const ExternalLink = ({
  children,
  target = '_blank',
  ...props
}: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => {
  const opensNewTab = target === '_blank'
  return (
    <a className="external-link" target={target} rel={opensNewTab ? 'noreferrer' : undefined} {...props}>
      {children}
      {opensNewTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  )
}
