interface LoadingStateProps {
  label?: string
}

export const LoadingState = ({ label = 'Loading…' }: LoadingStateProps) => {
  return <div className="loading-state">{label}</div>
}
