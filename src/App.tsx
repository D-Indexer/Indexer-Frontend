import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { routeDefinitions } from '@/app/routing'
import { LoadingState } from '@/components/ui'
import { appRoutes } from '@/config/routes'
import { AppLayout } from '@/layouts/AppLayout'

const PublicPortfolioPage = lazy(() =>
  import('@/pages/PublicPortfolio').then((module) => ({ default: module.PublicPortfolioPage })),
)

export const App = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {routeDefinitions.map((route) =>
          route.path === appRoutes.publicPortfolio ? null : (
            <Route key={route.path} path={route.path} element={route.element} />
          ),
        )}
        <Route
          path={appRoutes.publicPortfolio}
          element={
            <Suspense fallback={<LoadingState label="Loading public page…" />}>
              <PublicPortfolioPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to={appRoutes.home} replace />} />
      </Route>
    </Routes>
  )
}
