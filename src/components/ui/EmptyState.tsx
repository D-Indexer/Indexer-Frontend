interface EmptyStateProps {
  title: string
  description: string
}

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <section className="empty-state" aria-label={title}>
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  )
}
