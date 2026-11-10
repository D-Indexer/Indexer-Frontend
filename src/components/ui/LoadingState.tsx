interface LoadingStateProps {
  label?: string
  minHeight?: string
}

export const LoadingState = ({ label = 'Loading…', minHeight }: LoadingStateProps) => {
  return (
    <div className="loading-state" role="status" aria-live="polite" style={minHeight ? { minHeight } : undefined}>
      <span className="loading-state__spinner" aria-hidden="true" />
      {label}
    </div>
  )
}
