import type { ReactNode } from 'react'
import { appRoutes } from '@/config/routes'
import { CreatePortfolioPage, DashboardPage, HomePage, PortfolioPage, TemplatesPage } from '@/pages'

export interface RouteDefinition {
  element: ReactNode
  path: string
}

export const routeDefinitions: RouteDefinition[] = [
  { path: appRoutes.home, element: <HomePage /> },
  { path: appRoutes.dashboard, element: <DashboardPage /> },
  { path: appRoutes.templates, element: <TemplatesPage /> },
  { path: appRoutes.createPortfolio, element: <CreatePortfolioPage /> },
  { path: appRoutes.portfolioDetail, element: <PortfolioPage /> },
]
