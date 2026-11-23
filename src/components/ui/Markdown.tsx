import type { ReactNode } from 'react'
import { fromMarkdown } from 'mdast-util-from-markdown'
import type { PhrasingContent, RootContent } from 'mdast'

const ALLOWED_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

/** Returns the URL when it is absolute with an allowed protocol, otherwise null. */
export const safeHref = (url: string): string | null => {
  try {
    const parsed = new URL(url.trim())
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

/** Headings in authored text sit below the page's h1/h2, so depth 1 maps to h3. */
const headingTag = (depth: number) => `h${Math.min(depth + 2, 6)}` as 'h3' | 'h4' | 'h5' | 'h6'

const renderNodes = (nodes: Array<RootContent | PhrasingContent>): ReactNode[] => nodes.map((node, index) => renderNode(node, index))

/**
 * AST to React elements. Only the elements listed here can be produced; raw HTML nodes and images
 * are rendered as literal text and unsafe link targets drop the link.
 */
const renderNode = (node: RootContent | PhrasingContent, key: number): ReactNode => {
  switch (node.type) {
    case 'text':
      return node.value
    case 'paragraph':
      return <p key={key}>{renderNodes(node.children)}</p>
    case 'heading': {
      const Tag = headingTag(node.depth)
      return <Tag key={key}>{renderNodes(node.children)}</Tag>
    }
    case 'emphasis':
      return <em key={key}>{renderNodes(node.children)}</em>
    case 'strong':
      return <strong key={key}>{renderNodes(node.children)}</strong>
    case 'inlineCode':
      return <code key={key}>{node.value}</code>
    case 'code':
      return (
        <pre key={key}>
          <code>{node.value}</code>
        </pre>
      )
    case 'blockquote':
      return <blockquote key={key}>{renderNodes(node.children)}</blockquote>
    case 'list': {
      const Tag = node.ordered ? 'ol' : 'ul'
      return <Tag key={key}>{renderNodes(node.children)}</Tag>
    }
    case 'listItem':
      return <li key={key}>{renderNodes(node.children)}</li>
    case 'thematicBreak':
      return <hr key={key} />
    case 'break':
      return <br key={key} />
    case 'link': {
      const href = safeHref(node.url)
      return href ? (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">
          {renderNodes(node.children)}
        </a>
      ) : (
        <span key={key}>{renderNodes(node.children)}</span>
      )
    }
    case 'html':
      return node.value
    case 'image':
      return node.alt ?? ''
    default:
      return 'children' in node ? <span key={key}>{renderNodes(node.children as RootContent[])}</span> : 'value' in node ? String(node.value) : null
  }
}

/** Renders a restricted Markdown subset (CommonMark, no raw HTML, no GFM) without `dangerouslySetInnerHTML`. */
export const Markdown = ({ className, source }: { className?: string; source: string }) => (
  <div className={className ? `markdown ${className}` : 'markdown'}>{renderNodes(fromMarkdown(source).children)}</div>
)
