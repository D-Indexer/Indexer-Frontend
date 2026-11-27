import { describe, expect, it } from 'vitest'
import { getPortfolioLinks, getPortfolioLinkError, inferPortfolioLinkKind, serializePortfolioLinks } from './portfolioLinks'

describe('portfolio link helpers', () => {
  it('infers supported kinds from existing URLs', () => {
    expect(inferPortfolioLinkKind('https://github.com/example')).toBe('github')
    expect(inferPortfolioLinkKind('https://www.linkedin.com/in/example')).toBe('linkedin')
    expect(inferPortfolioLinkKind('mailto:jane@example.com')).toBe('email')
    expect(inferPortfolioLinkKind('https://example.com')).toBe('website')
  })

  it('preserves legacy link labels when metadata is absent', () => {
    expect(getPortfolioLinks({ links: ['https://example.com/profile'] })).toEqual([
      { kind: 'website', url: 'https://example.com/profile', label: 'example.com/profile' },
    ])
  })

  it('validates links by type and serializes email addresses as mailto URLs', () => {
    expect(getPortfolioLinkError({ kind: 'github', url: 'https://example.com', label: '' })).toBe('Use a GitHub URL.')
    expect(getPortfolioLinkError({ kind: 'email', url: 'invalid', label: '' })).toBe('Enter a valid email address.')
    expect(serializePortfolioLinks([
      { kind: 'email', url: 'jane@example.com', label: '' },
      { kind: 'website', url: '', label: '' },
    ])).toEqual([{ kind: 'email', url: 'mailto:jane@example.com', label: 'Email' }])
  })
})
