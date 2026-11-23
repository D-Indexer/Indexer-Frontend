import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Markdown, safeHref } from './Markdown'

const ALLOWED_TAGS = new Set(['DIV', 'P', 'H3', 'H4', 'H5', 'H6', 'EM', 'STRONG', 'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR', 'BR', 'A', 'SPAN'])

const dom = (source: string) => {
  const root = document.createElement('div')
  root.innerHTML = renderToStaticMarkup(<Markdown source={source} />)
  return root
}

describe('Markdown', () => {
  it('renders the supported subset', () => {
    const root = dom('# Title\n\n*em* **strong** `code`\n\n- a\n- b\n\n1. x\n\n[ok](https://example.com)')
    expect(root.querySelector('h3')?.textContent).toBe('Title')
    expect(root.querySelector('em')?.textContent).toBe('em')
    expect(root.querySelectorAll('ul li')).toHaveLength(2)
    expect(root.querySelector('ol li')?.textContent).toBe('x')
    const link = root.querySelector('a')
    expect(link?.getAttribute('href')).toBe('https://example.com/')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer nofollow')
  })

  it('never emits raw HTML', () => {
    const root = dom('<script>alert(1)</script><img src=x onerror=alert(1)>\n\n<div onclick="x()">hi</div>')
    expect(root.querySelector('script, img, [onclick], [onerror]')).toBeNull()
    expect(root.textContent).toContain('<script>alert(1)</script>')
  })

  it.each(['javascript:alert(1)', 'JaVaScript:alert(1)', 'data:text/html,hi', 'vbscript:x', '//evil.com', '/relative', ' javascript:alert(1)'])(
    'drops the link for %s',
    (url) => {
      expect(safeHref(url)).toBeNull()
      expect(dom(`[x](<${url}>)`).querySelector('a')).toBeNull()
    },
  )

  it('keeps http, https and mailto links', () => {
    expect(safeHref('http://a.com')).not.toBeNull()
    expect(safeHref('mailto:a@b.com')).not.toBeNull()
  })

  it('only produces allow-listed elements and safe hrefs for random input', () => {
    const fragments = ['<b>', '</b>', '<script>', '<img src=x>', '[a](javascript:x)', '[b](https://x.y)', '![i](http://i)', '**', '*', '`', '```\n', '# ', '> ', '- ', '1. ', '\n', '\n\n', '<!--', '&lt;', 'text', '<a href="javascript:x">', '[c]: javascript:x\n[c]']
    let seed = 42
    const next = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
    for (let n = 0; n < 200; n += 1) {
      const source = Array.from({ length: 1 + Math.floor(next() * 12) }, () => fragments[Math.floor(next() * fragments.length)]).join('')
      const root = dom(source)
      root.querySelectorAll('*').forEach((element) => {
        expect(ALLOWED_TAGS.has(element.tagName), `${element.tagName} from ${JSON.stringify(source)}`).toBe(true)
        element.getAttributeNames().forEach((name) => expect(['class', 'href', 'target', 'rel']).toContain(name))
      })
      root.querySelectorAll('a').forEach((a) => expect(/^(https?:|mailto:)/.test(a.getAttribute('href') ?? '')).toBe(true))
    }
  })
})
