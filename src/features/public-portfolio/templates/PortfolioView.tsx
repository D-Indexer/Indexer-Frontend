import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { LoadingState } from '@/components/ui'
import type { PortfolioContent } from '@/types'
import { humanizeField, sanitizeDisplayText } from '@/utils/format'

interface ViewProps {
  content: PortfolioContent
}

/** IPFS-sourced text, isolated from surrounding bidi context and stripped of invisible characters. */
const Text = ({ value }: { value: string }) => <bdi>{sanitizeDisplayText(value)}</bdi>

const Links = ({ links }: { links: string[] }) =>
  links.length > 0 ? (
    <ul className="portfolio__links" aria-label="Links">
      {links.map((link) => (
        <li key={link}>
          <ExternalLink href={link}>{sanitizeDisplayText(link.replace(/^https?:\/\//, ''))}</ExternalLink>
        </li>
      ))}
    </ul>
  ) : null
}

const Skills = ({ label = 'Skills', skills }: { label?: string; skills: string[] }) =>
  skills.length > 0 ? (
    <section className="portfolio__section" aria-label={label}>
      <h2>{label}</h2>
      <ul className="tag-list">
        {skills.map((skill) => (
          <li key={skill}>
            <Text value={skill} />
          </li>
        ))}
      </ul>
    </section>
  ) : null

/** Long-form text: Markdown for new documents, the unchanged plain-text paragraph for older ones. */
const Prose = ({ className = '', content, text }: { className?: string; content: Pick<PortfolioContent, 'content_format'>; text: string }) =>
  content.content_format === 'markdown' ? (
    <Markdown className={`portfolio__prose ${className}`.trim()} source={text} />
  ) : (
    <p className={`portfolio__prose ${className}`.trim()}>{text}</p>
  )

const Sections = ({ content, sections, only }: { content: PortfolioContent; only?: string[]; sections: Record<string, string> }) => (
  <>
    {Object.entries(sections)
      .filter(([key, value]) => value && (!only || only.includes(key)))
      .map(([key, value]) => (
        <section key={key} className="portfolio__section">
          <h2>{humanizeField(key)}</h2>
          <p className="portfolio__prose">
            <Text value={value} />
          </p>
        </section>
      ))}
  </>
)

const Header = ({ content }: ViewProps) => (
  <header className="portfolio__header">
    <h1>
      <Text value={content.name} />
    </h1>
    {content.headline ? (
      <p className="portfolio__headline">
        <Text value={content.headline} />
      </p>
    ) : null}
    <p className="muted mono">
      <Text value={content.folder} />
    </p>
  </header>
)

/** Template 1, Developer: single page, skills first, then projects and history. */
const DeveloperView = ({ content }: ViewProps) => (
  <article className="portfolio portfolio--developer">
    <Header content={content} />
    <p className="portfolio__prose">
      <Text value={content.bio} />
    </p>
    <Skills skills={content.skills} />
    <Sections sections={content.sections} />
    <Links content={content} />
  </article>
)

/** Template 2, Designer: visual-first, sections as a card grid. */
const DesignerView = ({ content }: ViewProps) => (
  <article className="portfolio portfolio--designer">
    <Header content={content} />
    <p className="portfolio__prose portfolio__lead">
      <Text value={content.bio} />
    </p>
    <div className="portfolio__grid">
      <Sections content={content} sections={content.sections} />
    </div>
    <Skills label="Tools and skills" skills={content.skills} />
    <Links content={content} />
  </article>
)

/** Template 3, Operations: résumé with a sidebar. */
const OperationsView = ({ content }: ViewProps) => (
  <article className="portfolio portfolio--operations">
    <Header content={content} />
    <div className="portfolio__resume">
      <div>
        <p className="portfolio__prose">
          <Text value={content.bio} />
        </p>
        <Sections sections={content.sections} only={['experience', 'references']} />
      </div>
      <div>
        <Skills skills={content.skills} />
        <Sections sections={content.sections} only={['certifications']} />
        <Links content={content} />
      </div>
    </div>
  </article>
)

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TemplateRenderer error, falling back to GenericLayout:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return <GenericLayout content={this.props.fallbackContent} />
    }
    return this.props.children
  }
}

/** Renders portfolio content using the lazy template registry, with fallback to generic layout. */
export const PortfolioView = ({ content, templateId }: PortfolioViewProps) => {
  const Renderer = getTemplateRenderer(templateId)

  return (
    <TemplateErrorBoundary fallbackContent={content}>
      <Suspense fallback={<LoadingState label="Loading template layout…" />}>
        <Renderer content={content} />
      </Suspense>
    </TemplateErrorBoundary>
  )
}
