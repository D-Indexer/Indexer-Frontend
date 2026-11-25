export const appRoutes = {
  home: '/',
  dashboard: '/dashboard',
  templates: '/templates',
  publicByAddress: '/a/:address',
  explore: '/explore',
  publicPortfolio: '/p/:folderName',
  publicPortfolioFor: (folderName: string) => `/p/${encodeURIComponent(folderName)}`,
} as const

/**
 * Route templates used for analytics. Only these fixed strings are ever reported, so folder
 * names, addresses and other identifiers never leave the browser.
 */
export const routeTemplates = {
  home: '/',
  dashboard: '/dashboard',
  templates: '/templates',
  publicPortfolio: '/p/:folderName',
  notFound: '*',
} as const

export type RouteTemplate = (typeof routeTemplates)[keyof typeof routeTemplates]

/** Maps a concrete pathname to its route template. */
export const toRouteTemplate = (pathname: string): RouteTemplate => {
  if (pathname === appRoutes.home) return routeTemplates.home
  if (pathname === appRoutes.dashboard) return routeTemplates.dashboard
  if (pathname === appRoutes.templates) return routeTemplates.templates
  if (pathname === '/p' || pathname.startsWith('/p/')) return routeTemplates.publicPortfolio
  return routeTemplates.notFound
}
