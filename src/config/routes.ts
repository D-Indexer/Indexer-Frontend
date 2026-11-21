export const appRoutes = {
  home: '/',
  dashboard: '/dashboard',
  templates: '/templates',
  settings: '/settings',
  publicPortfolio: '/p/:folderName',
  publicPortfolioFor: (folderName: string) => `/p/${encodeURIComponent(folderName)}`,
} as const
