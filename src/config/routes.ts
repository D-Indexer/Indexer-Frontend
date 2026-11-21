export const appRoutes = {
  home: '/',
  dashboard: '/dashboard',
  templates: '/templates',
  status: '/status',
  publicPortfolio: '/p/:folderName',
  publicPortfolioFor: (folderName: string) => `/p/${encodeURIComponent(folderName)}`,
} as const
