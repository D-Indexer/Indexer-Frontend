import type { ReactNode } from 'react'

interface EmptyStateProps {
  action?: ReactNode
  description: string
  title: string
}

export const EmptyState = ({ action, description, title }: EmptyStateProps) => {
  return (
    <section className="empty-state" aria-label={title}>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </section>
  )
}
