import type { ReactNode } from 'react'
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

export const routeDefinitions: RouteDefinition[] = [
  { path: appRoutes.home, element: <HomePage /> },
  { path: appRoutes.dashboard, element: <DashboardPage /> },
  { path: appRoutes.templates, element: <TemplatesPage /> },
  { path: appRoutes.explore, element: <ExplorePage /> },
  { path: appRoutes.publicPortfolio, element: <PublicPortfolioPage /> },
  { path: appRoutes.publicByAddress, element: <PublicByAddressPage /> },
]
