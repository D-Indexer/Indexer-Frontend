interface LoadingStateProps {
  label?: string
}

export const LoadingState = ({ label = 'Loading…' }: LoadingStateProps) => {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      {label}
    </div>
  )
}
