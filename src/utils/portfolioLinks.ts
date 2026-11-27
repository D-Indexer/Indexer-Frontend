import type { PortfolioContent, PortfolioLink, PortfolioLinkKind } from '@/types'
import { isHttpUrl } from './validation'

export const PORTFOLIO_LINK_KINDS: Array<{ value: PortfolioLinkKind; label: string }> = [
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
]

export const portfolioLinkKindLabel = (kind: PortfolioLinkKind) =>
  PORTFOLIO_LINK_KINDS.find((option) => option.value === kind)?.label ?? 'Link'

export const inferPortfolioLinkKind = (url: string): PortfolioLinkKind => {
  if (/^mailto:/i.test(url.trim())) return 'email'
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    if (hostname === 'github.com' || hostname.endsWith('.github.com')) return 'github'
    if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) return 'linkedin'
  } catch {
    return 'website'
  }
  return 'website'
}

export const getPortfolioLinks = (content: Pick<PortfolioContent, 'links' | 'link_meta'>): PortfolioLink[] => {
  if (content.link_meta?.length) return content.link_meta
  return content.links.map((url) => ({
    url,
    kind: inferPortfolioLinkKind(url),
    label: url.replace(/^https?:\/\//, ''),
  }))
}

export const getPortfolioLinkError = (link: PortfolioLink): string | undefined => {
  const url = link.url.trim()
  if (!url) return undefined

  if (link.kind === 'email') {
    const email = url.replace(/^mailto:/i, '')
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : 'Enter a valid email address.'
  }

  if (!isHttpUrl(url)) return 'Enter a valid http(s) URL.'

  if (link.kind === 'github' || link.kind === 'linkedin') {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    const domain = link.kind === 'github' ? 'github.com' : 'linkedin.com'
    if (hostname !== domain && !hostname.endsWith(`.${domain}`)) {
      return `Use a ${portfolioLinkKindLabel(link.kind)} URL.`
    }
  }

  return undefined
}

export const serializePortfolioLinks = (links: PortfolioLink[]) =>
  links
    .filter((link) => link.url.trim())
    .map((link) => {
      const email = link.url.trim().replace(/^mailto:/i, '')
      const url = link.kind === 'email' ? `mailto:${email}` : link.url.trim()
      return { kind: link.kind, url, label: link.label.trim() || portfolioLinkKindLabel(link.kind) }
    })
