import type { ReactNode } from 'react'
import type { LoaderFunctionArgs, RouteObject } from 'react-router-dom'
import { appRoutes } from '@/config/routes'
import {
  DashboardPage,
  ExplorePage,
  HomePage,
  PublicByAddressPage,
  PublicPortfolioPage,
  TemplatesPage,
} from '@/pages'

export interface RouteDefinition {
  element: ReactNode
  path: string
}

export const publicPortfolioLoader = async ({ params }: LoaderFunctionArgs) => {
  const folderName = params.folderName ?? ''
  if (!folderName) return null
  return loadPublicPortfolio(folderName)
}

export const routes: RouteObject[] = [
  { path: appRoutes.home, element: <HomePage />, errorElement: <RouteErrorBoundary /> },
  { path: appRoutes.dashboard, element: <DashboardPage />, errorElement: <RouteErrorBoundary /> },
  { path: appRoutes.templates, element: <TemplatesPage />, errorElement: <RouteErrorBoundary /> },
  {
    path: appRoutes.publicPortfolio,
    element: <PublicPortfolioPage />,
    loader: publicPortfolioLoader,
    errorElement: <RouteErrorBoundary />,
  },
]

export const routeDefinitions: RouteDefinition[] = [
  { path: appRoutes.home, element: <HomePage /> },
  { path: appRoutes.dashboard, element: <DashboardPage /> },
  { path: appRoutes.templates, element: <TemplatesPage /> },
  { path: appRoutes.explore, element: <ExplorePage /> },
  { path: appRoutes.publicPortfolio, element: <PublicPortfolioPage /> },
  { path: appRoutes.publicByAddress, element: <PublicByAddressPage /> },
]
