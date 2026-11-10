import type { ReactNode } from 'react'

interface SectionHeaderProps {
  action?: ReactNode
  description?: string
  eyebrow?: string
  /** Heading level; page titles use 1, sections 2. */
  level?: 1 | 2 | 3
  title: string
  titleId?: string
}

export const SectionHeader = ({ action, description, eyebrow, level = 1, title, titleId }: SectionHeaderProps) => {
  const Heading = `h${level}` as const
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <p className="hero__eyebrow">{eyebrow}</p> : null}
        <Heading id={titleId} className={level === 1 ? 'page-title' : undefined}>
          {title}
        </Heading>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
