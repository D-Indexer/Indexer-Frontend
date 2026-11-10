import { ExternalLink } from '@/components/ui'
import type { PortfolioContent } from '@/types'
import { humanizeField } from '@/utils/format'

interface ViewProps {
  content: PortfolioContent
}

const Links = ({ links }: { links: string[] }) =>
  links.length > 0 ? (
    <ul className="portfolio__links" aria-label="Links">
      {links.map((link) => (
        <li key={link}>
          <ExternalLink href={link}>{link.replace(/^https?:\/\//, '')}</ExternalLink>
        </li>
      ))}
    </ul>
  ) : null

const Skills = ({ label = 'Skills', skills }: { label?: string; skills: string[] }) =>
  skills.length > 0 ? (
    <section className="portfolio__section" aria-label={label}>
      <h2>{label}</h2>
      <ul className="tag-list">
        {skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </section>
  ) : null

const Sections = ({ sections, only }: { only?: string[]; sections: Record<string, string> }) => (
  <>
    {Object.entries(sections)
      .filter(([key, value]) => value && (!only || only.includes(key)))
      .map(([key, value]) => (
        <section key={key} className="portfolio__section">
          <h2>{humanizeField(key)}</h2>
          <p className="portfolio__prose">{value}</p>
        </section>
      ))}
  </>
)

const Header = ({ content }: ViewProps) => (
  <header className="portfolio__header">
    <h1>{content.name}</h1>
    {content.headline ? <p className="portfolio__headline">{content.headline}</p> : null}
    <p className="muted mono">{content.folder}</p>
  </header>
)

/** Template 1, Developer: single page, skills first, then projects and history. */
const DeveloperView = ({ content }: ViewProps) => (
  <article className="portfolio portfolio--developer">
    <Header content={content} />
    <p className="portfolio__prose">{content.bio}</p>
    <Skills skills={content.skills} />
    <Sections sections={content.sections} />
    <Links links={content.links} />
  </article>
)

/** Template 2, Designer: visual-first, sections as a card grid. */
const DesignerView = ({ content }: ViewProps) => (
  <article className="portfolio portfolio--designer">
    <Header content={content} />
    <p className="portfolio__prose portfolio__lead">{content.bio}</p>
    <div className="portfolio__grid">
      <Sections sections={content.sections} />
    </div>
    <Skills label="Tools and skills" skills={content.skills} />
    <Links links={content.links} />
  </article>
)

/** Template 3, Operations: résumé with a sidebar. */
const OperationsView = ({ content }: ViewProps) => (
  <article className="portfolio portfolio--operations">
    <Header content={content} />
    <div className="portfolio__resume">
      <div>
        <p className="portfolio__prose">{content.bio}</p>
        <Sections sections={content.sections} only={['experience', 'references']} />
      </div>
      <div>
        <Skills skills={content.skills} />
        <Sections sections={content.sections} only={['certifications']} />
        <Links links={content.links} />
      </div>
    </div>
  </article>
)

const views: Record<number, (props: ViewProps) => JSX.Element> = {
  1: DeveloperView,
  2: DesignerView,
  3: OperationsView,
}

interface PortfolioViewProps extends ViewProps {
  templateId: number | null
}

/** Renders portfolio content with its template's layout; unknown templates use the developer layout. */
export const PortfolioView = ({ content, templateId }: PortfolioViewProps) => {
  const View = (templateId !== null && views[templateId]) || DeveloperView
  return <View content={content} />
}
