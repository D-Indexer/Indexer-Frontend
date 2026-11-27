import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onReset?: () => void
  resetKeys?: unknown[]
}

export interface ErrorBoundaryState {
  copied: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    copied: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props
    if (this.state.error && resetKeys && prevProps.resetKeys) {
      const hasChanged = resetKeys.some((key, idx) => key !== prevProps.resetKeys?.[idx])
      if (hasChanged) {
        this.reset()
      }
    }
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ copied: false, error: null })
  }

  copyDetails = async () => {
    if (!this.state.error) return
    const text = `${this.state.error.name}: ${this.state.error.message}\n${this.state.error.stack ?? ''}`
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    } catch {
      // Ignore clipboard write failures
    }
  }

  override render() {
    const { copied, error } = this.state
    const { children, fallback } = this.props

    if (error) {
      if (fallback) {
        return fallback(error, this.reset)
      }

      return (
        <div className="error-boundary p-6 my-4 border border-red-500/30 bg-red-950/20 rounded-xl" role="alert">
          <h2 className="text-xl font-semibold text-red-300">Something went wrong</h2>
          <p className="text-sm text-red-200 mt-2">{error.message || 'An unexpected rendering error occurred.'}</p>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={this.reset}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-medium"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => void this.copyDetails()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-sm font-medium"
            >
              {copied ? 'Copied!' : 'Copy details'}
            </button>
          </div>
        </div>
      )
    }

    return children
  }
}
