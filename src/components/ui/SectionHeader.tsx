import type { ReactNode } from 'react'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export const SectionHeader = ({ eyebrow, title, description, action }: SectionHeaderProps) => {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <p className="hero__eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
