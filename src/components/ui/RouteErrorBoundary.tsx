import { useRouteError } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'

export const RouteErrorBoundary = () => {
  const routeError = useRouteError()
  const error = routeError instanceof Error ? routeError : new Error(String(routeError ?? 'Route navigation failed'))

  return (
    <div className="route-error-container p-8 max-w-xl mx-auto">
      <ErrorBoundary
        fallback={(_, reset) => (
          <div className="p-6 border border-red-500/30 bg-red-950/20 rounded-xl" role="alert">
            <h1 className="text-2xl font-bold text-red-300">Navigation Error</h1>
            <p className="mt-2 text-sm text-red-200">{error.message}</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  reset()
                  window.location.reload()
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium"
              >
                Reload page
              </button>
            </div>
          </div>
        )}
      >
        <Thrower error={error} />
      </ErrorBoundary>
    </div>
  )
}

const Thrower = ({ error }: { error: Error }): null => {
  throw error
}
