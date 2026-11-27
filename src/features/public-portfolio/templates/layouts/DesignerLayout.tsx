import { ExternalLink } from '@/components/ui'
import { humanizeField } from '@/utils/format'
import type { TemplateRendererProps } from '../types'

export const DesignerLayout = ({ content }: TemplateRendererProps) => {
  return (
    <article className="portfolio portfolio--designer">
      <header className="portfolio__header">
        <h1>{content.name}</h1>
        {content.headline ? <p className="portfolio__headline">{content.headline}</p> : null}
        <p className="muted mono">{content.folder}</p>
      </header>
      <p className="portfolio__prose portfolio__lead">{content.bio}</p>
      <div className="portfolio__grid">
        {Object.entries(content.sections)
          .filter(([, value]) => Boolean(value))
          .map(([key, value]) => (
            <section key={key} className="portfolio__section">
              <h2>{humanizeField(key)}</h2>
              <p className="portfolio__prose">{value}</p>
            </section>
          ))}
      </div>
      {content.skills.length > 0 ? (
        <section className="portfolio__section" aria-label="Tools and skills">
          <h2>Tools and skills</h2>
          <ul className="tag-list">
            {content.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {content.links.length > 0 ? (
        <ul className="portfolio__links" aria-label="Links">
          {content.links.map((link) => (
            <li key={link}>
              <ExternalLink href={link}>{link.replace(/^https?:\/\//, '')}</ExternalLink>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

export default DesignerLayout
